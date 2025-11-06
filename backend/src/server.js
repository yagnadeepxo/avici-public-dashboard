const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { runHourlyJob } = require("./cron/hourly");
const { runDailyJob } = require("./cron/daily");

require("./cron/wallet_swap_daily");
require("./cron/wallet_transaction_daily");

const { supabase } = require("./db");
require("dotenv").config();
const walletTransactionRoute = require("./routes/wallet_transaction_route/wallet_transaction");
const walletSwapRoute = require("./routes/wallet_swap_route/wallet_swaps");
const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://avici-public-dashboard.vercel.app"], // frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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

app.use("/api/wallet", walletTransactionRoute);
app.use("/api/wallet", walletSwapRoute);
// ⏰ Cron Jobs
cron.schedule("0 * * * *", runHourlyJob); // every hour
cron.schedule("0 0 * * *", runDailyJob);  // every day at midnight

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));