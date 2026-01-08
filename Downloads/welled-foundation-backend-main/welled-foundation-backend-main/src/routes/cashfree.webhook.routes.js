import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/cashfree/webhook", async (req, res) => {
  try {
    console.log("✅ Webhook HIT");

    const payload = req.body;
    const payment = payload?.data?.payment;
    const order = payload?.data?.order;
    const customer = payload?.data?.customer_details;

    if (!payment || !order) {
      return res.status(200).send("Invalid payload");
    }

    const paymentStatus = payment.payment_status;

    // ✅ Accept only known statuses
    if (!["SUCCESS", "FAILED", "PENDING"].includes(paymentStatus)) {
      console.log("⚠️ Unknown payment status:", paymentStatus);
      return res.status(200).send("Ignored");
    }

    // 🔄 MAP PAYMENT STATUS
    let dbPaymentStatus;
    switch (paymentStatus) {
      case "SUCCESS":
        dbPaymentStatus = "success";
        break;
      case "FAILED":
        dbPaymentStatus = "failed";
        break;
      case "PENDING":
      default:
        dbPaymentStatus = "pending";
    }

    // 💳 PAYMENT METHOD OBJECT (Cashfree sends object)
    const paymentMethodObj = payment.payment_method || {};

    // ✅ DETECT PAYMENT METHOD
    const paymentMethod =
      paymentMethodObj.upi
        ? "upi"
        : paymentMethodObj.card
        ? "card"
        : paymentMethodObj.netbanking
        ? "netbanking"
        : "unknown";

    // ✅ EXTRACT UPI ID (ONLY IF UPI)
    const upiId = paymentMethodObj?.upi?.upi_id || null;

    // 👤 FIND DONOR
    const { data: donors, error: donorError } = await supabase
      .from("donors")
      .select("id")
      .eq("email", customer?.customer_email);

    if (donorError) throw donorError;

    let donorId = donors?.[0]?.id || null;

    // 👤 CREATE DONOR IF NOT EXISTS
    if (!donorId) {
      const fullName = customer?.customer_name || "Anonymous Donor";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "Anonymous";
      const lastName = nameParts.slice(1).join(" ") || "Donor";

      const { data: newDonor, error: newDonorError } = await supabase
        .from("donors")
        .insert({
          title: "Donor",
          first_name: firstName,
          last_name: lastName,
          email: customer?.customer_email,
          mobile: customer?.customer_phone,
          address: "Not provided (Online)",
          city: "NA",
          state: "NA",
          whatsapp_enabled: false
        })
        .select()
        .single();

      if (newDonorError) throw newDonorError;
      donorId = newDonor.id;
    }

    // 🔁 UPSERT DONATION (handles PENDING → SUCCESS/FAILED)
    const { data: existingDonation } = await supabase
      .from("donations")
      .select("id")
      .eq("order_id", order.order_id)
      .single();

    if (existingDonation) {
      // 🔄 UPDATE
      await supabase
        .from("donations")
        .update({
          payment_status: dbPaymentStatus,
          payment_method: paymentMethod,
          payment_id: payment.cf_payment_id,
          upi_id: upiId
        })
        .eq("order_id", order.order_id);

      console.log(`🔄 Donation updated → ${dbPaymentStatus}`);
    } else {
      // 💾 INSERT
      await supabase.from("donations").insert({
        donor_id: donorId,
        amount: order.order_amount,
        currency: order.order_currency,
        payment_status: dbPaymentStatus,
        payment_provider: "cashfree",
        payment_method: paymentMethod,
        payment_id: payment.cf_payment_id,
        order_id: order.order_id,
        donation_type: "ONLINE",
        upi_id: upiId
      });

      console.log(`✅ Donation inserted → ${dbPaymentStatus}`);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).send("Server error");
  }
});

export default router;
