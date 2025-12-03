const express = require("express");
const { supabase } = require("../../db");

const router = express.Router();

// GET /api/daily-alltime-stats?date=YYYY-MM-DD
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required. Format: YYYY-MM-DD",
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Expected YYYY-MM-DD",
      });
    }

    const { data, error } = await supabase
      .from("daily_alltime_stats")
      .select("*")
      .eq("snapshot_date", date)
      .single();

    if (error) {
      // If no data found, return 404
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          error: `No data found for date: ${date}`,
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("❌ Error fetching daily alltime stats:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

