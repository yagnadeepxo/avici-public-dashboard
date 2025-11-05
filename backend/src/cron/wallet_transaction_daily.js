const cron = require("node-cron");
const { aggregateTransactions } = require("../services/wallet_transaction_service/fetch_wallet_transactions.js");

// Runs every day at midnight UTC
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running daily transaction aggregation cron...");
  await aggregateTransactions();
});
