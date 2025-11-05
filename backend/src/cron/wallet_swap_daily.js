const cron = require("node-cron");
const { aggregateSwaps } = require("../services/wallet_swap_service/fetch_wallet_swaps.js");

// Runs every day at midnight UTC
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running daily transaction aggregation cron...");
  await aggregateSwaps();
});
