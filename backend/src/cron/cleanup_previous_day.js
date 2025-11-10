const { supabase } = require("../db");

async function cleanupPreviousDay() {
  try {
    // Calculate yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log(`🧹 Starting cleanup for previous day: ${yesterdayDate}`);

    // Delete all hourly_stats rows from the previous day
    const { data: deletedHourlyData, error: hourlyError } = await supabase
      .from("hourly_stats")
      .delete()
      .eq("date", yesterdayDate);

    if (hourlyError) {
      throw hourlyError;
    }

    // Get count of deleted rows (Supabase delete returns the deleted rows as an array)
    const deletedCount = Array.isArray(deletedHourlyData) ? deletedHourlyData.length : 0;

    console.log(`✅ Cleanup completed for ${yesterdayDate}`);
    console.log(`   Deleted ${deletedCount} row(s) from hourly_stats`);

    return {
      date: yesterdayDate,
      deletedCount,
      success: true
    };
  } catch (err) {
    console.error("❌ Cleanup cron error:", err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = { cleanupPreviousDay };

