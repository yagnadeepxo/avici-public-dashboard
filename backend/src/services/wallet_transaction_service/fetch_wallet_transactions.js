const axios = require("axios");
const { supabase } = require("../../db");

const API_BASE = "https://wallet-cron-production.up.railway.app/api/stats/transactions";

async function aggregateTransactions() {
  let page = 1;
  let hasMore = true;
  let totalVolume = 0;
  let totalCount = 0;

  console.log("🔁 Starting transaction aggregation...");

  while (hasMore) {
    try {
      const res = await axios.get(`${API_BASE}?page=${page}`);
      const data = res.data;

      totalVolume += data.total_volume_usd || 0;
      totalCount = data.total_count;
      hasMore = data.has_more;
      page++;

      console.log(
        `✅ Page ${page - 1} processed (volume: ${data.total_volume_usd}, count: ${data.total_count})`
      );
    } catch (err) {
      console.error(`❌ Error fetching page ${page}:`, err.message);
      break;
    }
  }

  console.log("📦 Aggregation complete. Saving to Supabase...");
  console.log("Final Totals:", { totalVolume, totalCount });

  // ✅ Upsert to ensure only one row is maintained
  const { error } = await supabase
    .from("wallet_transaction_aggregates")
    .upsert(
      {
        id: "1ff8ed32-2114-4c05-bd65-9ef39a48ed07",
        total_volume_usd: totalVolume,
        total_count: totalCount,
        last_updated: new Date()
      }
    );

  if (error) console.error("❌ Supabase upsert error:", error.message);
  else console.log("✅ Aggregated data upserted successfully.");
}

// Run directly when script is executed
if (require.main === module) {
  aggregateTransactions().catch(console.error);
}

module.exports = { aggregateTransactions };
