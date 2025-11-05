const axios = require("axios");
const { supabase } = require("../../db");

const API_BASE = "https://wallet-cron-production.up.railway.app/api/stats/swaps";

async function aggregateSwaps() {
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
      totalCount = data.total_count;// ✅ sum counts across all pages
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

  const { error } = await supabase
    .from("wallet_swap_aggregates")
    .upsert(
      {
        id: "5abf07c9-4d4c-438b-8b04-3f8bfa04ac11",
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
  aggregateSwaps().catch(console.error);
}

module.exports = { aggregateSwaps };
