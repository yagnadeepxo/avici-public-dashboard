const axios = require("axios");
const { supabase } = require("../db");

async function runHourlyJob() {
  try {
    const { data } = await axios.get(
      "https://avici-cron-production.up.railway.app/api/total-stats?timeframe=24H"
    );

    const currentHour = new Date().getUTCHours();
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get the previous hour's data to calculate the difference
    let previousHourData = null;
    
    // If current hour is 0, get the last hour (23) from previous day
    if (currentHour === 0) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const { data: prevData } = await supabase
        .from("hourly_stats")
        .select("total_spends, total_transactions")
        .eq("date", yesterdayDate)
        .eq("hour", 23)
        .single();
      
      previousHourData = prevData;
    } else {
      // Get previous hour from today
      const { data: prevData } = await supabase
        .from("hourly_stats")
        .select("total_spends, total_transactions")
        .eq("date", currentDate)
        .eq("hour", currentHour - 1)
        .single();
      
      previousHourData = prevData;
    }

    // Calculate hourly difference (absolute value to handle any edge cases)
    let hourlySpendDifference = 0;
    let hourlyTransactionDifference = 0;

    if (previousHourData) {
      hourlySpendDifference = Math.abs(data.totalSpends - previousHourData.total_spends);
      hourlyTransactionDifference = Math.abs(data.totalTransactions - previousHourData.total_transactions);
    } else {
      // If no previous data exists, use the current values as the difference
      // This handles the very first run of the cron job
      hourlySpendDifference = Math.abs(data.totalSpends);
      hourlyTransactionDifference = Math.abs(data.totalTransactions);
    }

    // Check if a row exists for this hour and date
    const { data: existingRow } = await supabase
      .from("hourly_stats")
      .select("id")
      .eq("date", currentDate)
      .eq("hour", currentHour)
      .single();

    const rowData = {
      date: currentDate,
      hour: currentHour,
      total_spends: data.totalSpends,
      total_credit_created: data.totalCreditCreated,
      total_transactions: data.totalTransactions,
      average_spend: data.averageSpend,
      active_cards: data.activeCards,
      unique_users: data.uniqueUsers,
      spend_transaction_count: data.spendTransactionCount,
      credit_transaction_count: data.creditTransactionCount,
      hourly_spend_difference: hourlySpendDifference,
      hourly_transaction_difference: hourlyTransactionDifference,
      timestamp: new Date().toISOString(),
    };

    let error;

    if (existingRow) {
      // Update existing row for this hour and date
      const result = await supabase
        .from("hourly_stats")
        .update(rowData)
        .eq("date", currentDate)
        .eq("hour", currentHour);
      error = result.error;
    } else {
      // Insert new row
      const result = await supabase
        .from("hourly_stats")
        .insert([rowData]);
      error = result.error;
    }

    if (error) throw error;

    console.log(`✅ Hourly stats ${existingRow ? 'updated' : 'inserted'} for ${currentDate} hour ${currentHour}`);
    console.log(`   Hourly spend difference: $${(hourlySpendDifference / 100).toLocaleString()}`);
    console.log(`   Previous hour data: ${previousHourData ? 'Found' : 'Not found (first run or missing data)'}`);
  } catch (err) {
    console.error("❌ Hourly cron error:", err.message);
  }
}

module.exports = { runHourlyJob };