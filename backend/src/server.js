const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { runHourlyJob } = require("./cron/hourly");
const { runDailyJob } = require("./cron/daily");
const { cleanupPreviousDay } = require("./cron/cleanup_previous_day");

//require("./cron/wallet_swap_daily");
//require("./cron/wallet_transaction_daily");
require("./cron/daily_alltime_stats");

const { supabase } = require("./db");
require("dotenv").config();
const walletTransactionRoute = require("./routes/wallet_transaction_route/wallet_transaction");
const walletSwapRoute = require("./routes/wallet_swap_route/wallet_swaps");
const dailyAlltimeStatsRoute = require("./routes/daily_alltime_stats_route/daily_alltime_stats");
const ironSummaryRoute = require("./routes/iron_route/iron_summary");
const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "https://endbanks.org",
      "https://www.endbanks.org",
      "https://avici-public-dashboard.vercel.app"
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log the origin for debugging
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.get("/api/stats", async (req, res) => {
  const { period, date } = req.query;
  try {
    // If date is provided, fetch specific date from daily_stats
    if (date) {
      const { data, error } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("date", date)
        .single();

      if (error) throw error;

      // Return as array to maintain consistency with period queries
      res.json(data ? [data] : []);
      return;
    }

    // Original period-based logic
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

//app.use("/api/wallet", walletTransactionRoute);
//app.use("/api/wallet", walletSwapRoute);
app.use("/api/daily-alltime-stats", dailyAlltimeStatsRoute);
app.use("/api/iron", ironSummaryRoute);
console.log("✅ Iron summary route registered at /api/iron");
console.log("✅ Available routes: /api/iron/summary, /api/iron/daily-summary, /api/iron/period-summary");
// ⏰ Cron Jobs
//cron.schedule("0 * * * *", runHourlyJob); // every hour
//cron.schedule("0 0 * * *", runDailyJob);  // every day at midnight
//cron.schedule("0 1 * * *", cleanupPreviousDay); // every day at 1 AM UTC to clean previous day's hourly data

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));