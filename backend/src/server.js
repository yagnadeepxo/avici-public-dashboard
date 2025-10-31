const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { runHourlyJob } = require("./cron/hourly");
const { runDailyJob } = require("./cron/daily");
const { supabase } = require("./db");
require("dotenv").config();

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: ["http://localhost:3000"], // frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.get("/api/stats", async (req, res) => {
  const { period } = req.query;
  try {
    let table = period === "24H" ? "hourly_stats" : "daily_stats";
    let limit = period === "7D" ? 7 : period === "30D" ? 30 : 24;

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⏰ Cron Jobs
cron.schedule("0 * * * *", runHourlyJob); // every hour
cron.schedule("0 0 * * *", runDailyJob);  // every day at midnight

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
