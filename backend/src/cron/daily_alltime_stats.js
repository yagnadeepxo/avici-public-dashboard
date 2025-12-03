const cron = require("node-cron");
const { fetchAndSaveDailyAlltimeStats } = require("../services/daily_alltime_stats_service/fetch_daily_alltime_stats.js");

// Runs every day at midnight UTC (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running daily alltime stats cron...");
  await fetchAndSaveDailyAlltimeStats();
});

