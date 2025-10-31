const axios = require("axios");
const { supabase } = require("../db");

async function runDailyJob() {
  try {
    const { data } = await axios.get(
      "https://avici-cron-production.up.railway.app/api/total-stats?timeframe=24H"
    );

    const { error } = await supabase.from("daily_stats").insert([
      {
        total_spends: data.totalSpends,
        total_credit_created: data.totalCreditCreated,
        total_transactions: data.totalTransactions,
        average_spend: data.averageSpend,
        active_cards: data.activeCards,
        unique_users: data.uniqueUsers,
        spend_transaction_count: data.spendTransactionCount,
        credit_transaction_count: data.creditTransactionCount,
      },
    ]);

    if (error) throw error;

    console.log("✅ Daily stats inserted at", new Date().toISOString());
  } catch (err) {
    console.error("❌ Daily cron error:", err.message);
  }
}

module.exports = { runDailyJob };
