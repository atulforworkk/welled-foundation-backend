import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ POST: Send Us a Message
router.post("/contact", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      organization,
      inquiryType,
      message,
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !inquiryType || !message) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing",
      });
    }

    const { error } = await supabase
      .from("contact_messages")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber || null,
        organization: organization || null,
        inquiry_type: inquiryType,
        message,
      });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully ✅",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
