const axios = require("axios");
const { supabase } = require("../../db");

const API_URL = "https://avici-cron-production.up.railway.app/api/total-stats";

async function fetchAndSaveDailyAlltimeStats() {
  try {
    console.log("🕛 Fetching daily alltime stats from API...");
    
    const { data } = await axios.get(API_URL);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const statsData = {
      snapshot_date: today,
      timeframe: data.timeframe,
      total_spends: parseInt(data.totalSpends),
      total_credit_created: parseInt(data.totalCreditCreated),
      total_transactions: parseInt(data.totalTransactions),
      average_spend: parseFloat(data.averageSpend),
      active_cards: parseInt(data.activeCards),
      unique_users: parseInt(data.uniqueUsers),
      spend_transaction_count: parseInt(data.spendTransactionCount),
      credit_transaction_count: parseInt(data.creditTransactionCount),
    };

    // Use upsert to handle duplicate dates (UNIQUE constraint on snapshot_date)
    const { error } = await supabase
      .from("daily_alltime_stats")
      .upsert(statsData, {
        onConflict: "snapshot_date",
      });

    if (error) throw error;

    console.log(`✅ Daily alltime stats saved for ${today} at`, new Date().toISOString());
    return statsData;
  } catch (err) {
    console.error("❌ Error fetching/saving daily alltime stats:", err.message);
    throw err;
  }
}

// Run directly when script is executed
if (require.main === module) {
  fetchAndSaveDailyAlltimeStats().catch(console.error);
}

module.exports = { fetchAndSaveDailyAlltimeStats };

