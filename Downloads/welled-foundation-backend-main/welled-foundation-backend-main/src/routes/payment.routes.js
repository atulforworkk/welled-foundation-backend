import express from "express"
import axios from "axios"
import { supabase } from "../supabase.js"

const router = express.Router()

// CREATE CASHFREE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const { amount, donorName, donorEmail, donorPhone } = req.body

    const response = await axios.post(
      `${process.env.CASHFREE_BASE_URL}/orders`,
      {
        order_id: "order_" + Date.now(),
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_name: donorName,
          customer_email: donorEmail,
          customer_phone: donorPhone,
        },
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    )

    res.json(response.data)
  } catch (err) {
    console.error("Create order error:", err.response?.data || err.message)
    res.status(500).json({ error: "Payment initiation failed" })
  }
})
router.post("/cashfree-webhook", async (req, res) => {
  try {
    const data = req.body

    // Only act on successful payments
    if (data.order_status !== "PAID") {
      return res.status(200).send("Ignored")
    }

    const {
      order_id,
      order_amount,
      order_currency,
      payment_id,
      customer_details,
    } = data

    const email = customer_details.customer_email
    const phone = customer_details.customer_phone
    const name = customer_details.customer_name || ""

    const [first_name, ...rest] = name.split(" ")
    const last_name = rest.join(" ")

    // 1️⃣ CHECK IF DONOR EXISTS
    let { data: donor } = await supabase
      .from("donors")
      .select("*")
      .eq("email", email)
      .single()

    // 2️⃣ CREATE DONOR IF NOT EXISTS
    if (!donor) {
      const { data: newDonor } = await supabase
        .from("donors")
        .insert([
          {
            first_name,
            last_name,
            email,
            mobile: phone,
          },
        ])
        .select()
        .single()

      donor = newDonor
    }

    // 3️⃣ CREATE DONATION ENTRY
    await supabase.from("donations").insert({
      donor_id: donor.id,
      amount: order_amount,
      currency: order_currency,
      payment_status: "PAID",
      payment_provider: "cashfree",
      payment_id: payment_id,
      order_id: order_id,
      donation_type: "ONLINE",
    });

    res.status(200).send("OK")
  } catch (err) {
    console.error("Webhook DB error:", err)
    res.status(500).send("Webhook error")
  }
})

export default router
