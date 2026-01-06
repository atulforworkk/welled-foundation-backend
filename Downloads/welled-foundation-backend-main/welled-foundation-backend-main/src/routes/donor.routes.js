import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/donor", async (req, res) => {
  try {
    const {
      title,
      name,
      email,
      dateOfBirth,
      mobile,
      alternateMobile,
      whatsappNumber,
      panNumber,
      address,
      pinCode,
      city,
      state,
      preferenceState,
    } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !address || !pinCode || !city || !state) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const { error } = await supabase.from("donors").insert({
      title,
      name,
      email,
      date_of_birth: dateOfBirth || null,
      mobile,
      alternate_mobile: alternateMobile || null,
      whatsapp_number: whatsappNumber || null,
      pan_number: panNumber || null,
      address,
      pin_code: pinCode,
      city,
      state,
      preference_state: preferenceState || null,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({
      message: "Donor details saved successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
