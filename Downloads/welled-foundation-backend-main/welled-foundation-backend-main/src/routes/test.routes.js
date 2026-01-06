import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// ✅ REAL SUPABASE TEST
router.get("/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("test_table")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Supabase connection working ✅",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
