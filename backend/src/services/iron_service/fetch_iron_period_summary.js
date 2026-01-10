const { fetchIronDailySummary } = require('./fetch_iron_daily_summary');
const { fetchIronSummary } = require('./fetch_iron_summary');
const { supabase } = require('../../db');

/**
 * Get week number for a date (weeks starting from 2025-11-02)
 */
function getWeekNumber(dateStr) {
  const startDate = new Date('2025-11-02T00:00:00.000Z');
  const currentDate = new Date(dateStr + 'T00:00:00.000Z');
  const diffTime = currentDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

/**
 * Get week label (start date to end date) - formatted nicely
 */
function getWeekLabel(weekNum) {
  const startDate = new Date('2025-11-02T00:00:00.000Z');
  const weekStart = new Date(startDate);
  weekStart.setUTCDate(weekStart.getUTCDate() + (weekNum * 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  
  // Format as "Nov 2-8" for better readability
  const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
  const startDay = weekStart.getUTCDate();
  const endDay = weekEnd.getUTCDate();
  const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

/**
 * Get week start and end dates for a week number
 */
function getWeekDates(weekNum) {
  const startDate = new Date('2025-11-02T00:00:00.000Z');
  const weekStart = new Date(startDate);
  weekStart.setUTCDate(weekStart.getUTCDate() + (weekNum * 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  return { weekStart, weekEnd };
}

/**
 * Get month key for a date
 * Returns format: "YYYY-MM" where MM is 01-12 (not 0-11)
 */
function getMonthKey(dateStr) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const month = date.getUTCMonth() + 1; // Convert from 0-11 to 1-12
  const monthStr = String(month).padStart(2, '0'); // Pad to 2 digits
  return `${date.getUTCFullYear()}-${monthStr}`;
}

/**
 * Get month label
 */
function getMonthLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Calculate period summary (7d, 30d, or 24h) with current day included
 * Returns aggregated totals and weekly/monthly/daily breakdown for graphs
 */
async function fetchIronPeriodSummary(filters = {}) {
  const { period = '7d', customer_id, status = 'Completed' } = filters;
  
  // Calculate date ranges
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  // Date range for GRAPH data (weekly aggregates from 2025-11-02 for 7d, monthly aggregates from 2025-03-01 for 30d, or daily for 24h)
  let graphStartDate, graphEndDate;
  let cardStartDate, cardEndDate;
  let useTimestampForCards = false;
  
  if (period === '24h') {
    // CARD data: Last 24 hours from current time (use timestamp)
    const cardEndTime = new Date(now);
    const cardStartTime = new Date(cardEndTime);
    cardStartTime.setUTCHours(cardStartTime.getUTCHours() - 24);
    
    cardStartDate = cardStartTime.toISOString();
    cardEndDate = cardEndTime.toISOString();
    useTimestampForCards = true;
    
    // GRAPH data: Last 24 days, excluding today (up to yesterday)
    const graphEnd = new Date(yesterday);
    const graphStart = new Date(graphEnd);
    graphStart.setUTCDate(graphStart.getUTCDate() - 23); // 24 days total (yesterday + 23 days back)
    
    graphStartDate = graphStart.toISOString().split('T')[0];
    graphEndDate = graphEnd.toISOString().split('T')[0];
  } else if (period === '7d') {
    // Last 7 days including today
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 6); // 7 days total (today + 6 days back)
    cardStartDate = start.toISOString().split('T')[0];
    
    // End date is today - fetchIronDailySummary will add T23:59:59.999Z to include full current day
    cardEndDate = today.toISOString().split('T')[0];
    
    // Date range for GRAPH data (weekly aggregates from 2025-11-02 to match card spends week boundaries)
    graphStartDate = '2025-11-02';
    graphEndDate = today.toISOString().split('T')[0];
  } else if (period === '30d') {
    // For 30d, ensure summary and graph use consistent date ranges
    // Graph data starts from 2025-03-01 to show monthly data from March 2025
    const graphStart = new Date('2025-03-01T00:00:00.000Z');
    const todayDateOnly = today.toISOString().split('T')[0];
    
    // Calculate last 30 days
    const last30DaysStart = new Date(today);
    last30DaysStart.setUTCDate(last30DaysStart.getUTCDate() - 29);
    const last30DaysStartStr = last30DaysStart.toISOString().split('T')[0];
    
    // Use the later of: graph start date (Mar 1) or last 30 days start
    // This ensures data is consistent between summary and graph
    if (last30DaysStart >= graphStart) {
      // Last 30 days starts on or after Mar 1, use last 30 days
      cardStartDate = last30DaysStartStr;
    } else {
      // Last 30 days starts before Mar 1, use Mar 1 to ensure consistency
      cardStartDate = '2025-03-01';
    }
    
    // End date is today - fetchIronDailySummary will add T23:59:59.999Z to include full current day
    cardEndDate = todayDateOnly;
    
    // Date range for GRAPH data (monthly aggregates from 2025-03-01)
    graphStartDate = '2025-03-01';
    graphEndDate = todayDateOnly;
  }
  
  console.log(`📊 Fetching ${period} summary:`);
  console.log(`   Card data: ${cardStartDate} to ${cardEndDate}`);
  console.log(`   Graph data: ${graphStartDate} to ${graphEndDate}`);
  
  // Additional debug for 30d period
  if (period === '30d') {
    const cardStart = new Date(cardStartDate + 'T00:00:00.000Z');
    const graphStart = new Date(graphStartDate + 'T00:00:00.000Z');
    console.log(`   ⚠️ 30d Date Range Check:`);
    console.log(`      Card start: ${cardStartDate} (${cardStart.toISOString()})`);
    console.log(`      Graph start: ${graphStartDate} (${graphStart.toISOString()})`);
    console.log(`      Date range match: ${cardStartDate === graphStartDate ? '✅ MATCH' : '❌ MISMATCH'}`);
  }
  
  // Fetch card data - use fetchIronSummary for 24h (timestamp-based), fetchIronDailySummary for others
  let cardSummary = null;
  let cardDailyResult = null;
  
  if (period === '24h' && useTimestampForCards) {
    // For 24h, use fetchIronSummary with timestamps
    cardSummary = await fetchIronSummary({
      start_date: cardStartDate,
      end_date: cardEndDate,
      customer_id,
      status
    });
  } else {
    // For 7d and 30d, use fetchIronDailySummary
    cardDailyResult = await fetchIronDailySummary({
      start_date: cardStartDate,
      end_date: cardEndDate,
      customer_id,
      status
    });
  }
  
  // Fetch daily summaries for GRAPH data
  const graphDailyResult = await fetchIronDailySummary({
    start_date: graphStartDate,
    end_date: graphEndDate,
    customer_id,
    status
  });
  
  // Aggregate totals for CARDS
  let totalTransactions = 0;
  let totalOnramps = 0;
  let totalOfframps = 0;
  let totalOnrampVolume = 0;
  let totalOfframpVolume = 0;
  let uniqueUsers = 0;
  
  if (period === '24h' && cardSummary && cardSummary.summary) {
    // Use summary data directly for 24h
    totalTransactions = cardSummary.summary.total_transactions || 0;
    totalOnramps = cardSummary.summary.total_onramps || 0;
    totalOfframps = cardSummary.summary.total_offramps || 0;
    totalOnrampVolume = parseFloat(cardSummary.summary.onramp_volume_usd || '0') || 0;
    totalOfframpVolume = parseFloat(cardSummary.summary.offramp_volume_usd || '0') || 0;
    uniqueUsers = cardSummary.summary.unique_users || 0;
  } else if (cardDailyResult) {
    // Calculate card totals from daily summaries
    for (const daily of cardDailyResult.daily_summaries) {
      const summary = daily.summary;
      totalTransactions += summary.total_transactions;
      totalOnramps += summary.total_onramps;
      totalOfframps += summary.total_offramps;
      totalOnrampVolume += parseFloat(summary.onramp_volume_usd);
      totalOfframpVolume += parseFloat(summary.offramp_volume_usd);
    }
    
    // Fetch transactions for card data to calculate unique users accurately
    // (Can't sum unique_users from daily summaries as it would double count)
    if (cardStartDate && cardEndDate) {
      let cardQuery = supabase
        .from('iron_transactions')
        .select('customer_id')
        .eq('status', status);
      
      if (customer_id) {
        cardQuery = cardQuery.eq('customer_id', customer_id);
      }
      
      const startDateWithTime = cardStartDate.includes('T') ? cardStartDate : `${cardStartDate}T00:00:00.000Z`;
      const endDateWithTime = cardEndDate.includes('T') ? cardEndDate : `${cardEndDate}T23:59:59.999Z`;
      cardQuery = cardQuery.gte('created_at', startDateWithTime).lte('created_at', endDateWithTime);
      
      const { data: cardTransactions, error: cardError } = await cardQuery;
      if (!cardError && cardTransactions) {
        const cardUniqueCustomers = new Set();
        for (const tx of cardTransactions) {
          if (tx.customer_id) {
            cardUniqueCustomers.add(tx.customer_id);
          }
        }
        uniqueUsers = cardUniqueCustomers.size;
      }
    }
  }
  
  const todayStr = graphEndDate;
  
  // Aggregate data by period (week for 7d, month for 30d, day for 24h) - use GRAPH data only
  const periodDataMap = new Map();
  
  for (const daily of graphDailyResult.daily_summaries) {
    const summary = daily.summary;
    
    // NOTE: Do NOT add to card totals here - card totals are already calculated above
    
    // Group by period
    let periodKey, periodLabel;
    if (period === '24h') {
      // For 24h, each day is its own period (no grouping)
      periodKey = daily.date;
      // Format date as "Jan 7" for better readability
      const date = new Date(daily.date + 'T00:00:00.000Z');
      periodLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (period === '7d') {
      const weekNum = getWeekNumber(daily.date);
      periodKey = `week-${weekNum}`;
      periodLabel = getWeekLabel(weekNum);
    } else if (period === '30d') {
      periodKey = getMonthKey(daily.date);
      periodLabel = getMonthLabel(daily.date);
    }
    
    if (!periodDataMap.has(periodKey)) {
      periodDataMap.set(periodKey, {
        period_key: periodKey,
        period_label: periodLabel,
        sort_key: period === '7d' ? getWeekNumber(daily.date) : (period === '24h' ? daily.date : periodKey), // For sorting
        total_transactions: 0,
        total_onramps: 0,
        total_offramps: 0,
        onramp_volume_usd: 0,
        offramp_volume_usd: 0,
        unique_customers: new Set(),
        is_ongoing: false,
        weekNum: period === '7d' ? getWeekNumber(daily.date) : null,
        monthKey: period === '30d' ? periodKey : null,
        dateStr: period === '24h' ? daily.date : null
      });
    }
    
    const periodData = periodDataMap.get(periodKey);
    periodData.total_transactions += summary.total_transactions;
    periodData.total_onramps += summary.total_onramps;
    periodData.total_offramps += summary.total_offramps;
    periodData.onramp_volume_usd += parseFloat(summary.onramp_volume_usd);
    periodData.offramp_volume_usd += parseFloat(summary.offramp_volume_usd);
    
    // For unique users, we'll calculate from transactions after aggregation
  }
  
  // Fetch transactions for graph data to calculate unique users per period
  let graphQuery = supabase
    .from('iron_transactions')
    .select('customer_id, created_at')
    .eq('status', status);
  
  if (customer_id) {
    graphQuery = graphQuery.eq('customer_id', customer_id);
  }
  
  const startDateWithTime = graphStartDate.includes('T') ? graphStartDate : `${graphStartDate}T00:00:00.000Z`;
  const endDateWithTime = graphEndDate.includes('T') ? graphEndDate : `${graphEndDate}T23:59:59.999Z`;
  graphQuery = graphQuery.gte('created_at', startDateWithTime).lte('created_at', endDateWithTime);
  
  const { data: graphTransactions, error: graphError } = await graphQuery;
  if (!graphError && graphTransactions) {
    // Group transactions by period and track unique customers
    for (const tx of graphTransactions) {
      if (!tx.customer_id) continue;
      
      const txDate = tx.created_at.split('T')[0];
      let periodKey;
      
      if (period === '24h') {
        periodKey = txDate;
      } else if (period === '7d') {
        const weekNum = getWeekNumber(txDate);
        periodKey = `week-${weekNum}`;
      } else if (period === '30d') {
        periodKey = getMonthKey(txDate);
      }
      
      if (periodDataMap.has(periodKey)) {
        periodDataMap.get(periodKey).unique_customers.add(tx.customer_id);
      }
    }
  }
  
  // After aggregating all data, check if each period is ongoing
  for (const [periodKey, periodData] of periodDataMap.entries()) {
    if (period === '24h') {
      // For 24h, mark yesterday as ongoing (since graph data excludes today)
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (periodData.dateStr === yesterdayStr) {
        periodData.is_ongoing = true;
      }
    } else if (period === '7d') {
      // Check if today falls within this week's range
      const { weekStart, weekEnd } = getWeekDates(periodData.weekNum);
      const todayDate = new Date(today);
      todayDate.setUTCHours(0, 0, 0, 0);
      
      if (todayDate >= weekStart && todayDate <= weekEnd) {
        periodData.is_ongoing = true;
      }
    } else if (period === '30d') {
      // Check if today's month matches this period's month
      const todayMonthKey = getMonthKey(todayStr);
      if (todayMonthKey === periodData.monthKey) {
        periodData.is_ongoing = true;
      }
    }
  }
  
  // Sort by period key and convert to array
  const sortedPeriodEntries = Array.from(periodDataMap.entries()).sort((a, b) => {
    if (period === '24h') {
      // Sort by date string (chronological)
      return a[1].sort_key.localeCompare(b[1].sort_key);
    } else if (period === '7d') {
      // Sort by week number
      return a[1].sort_key - b[1].sort_key;
    } else if (period === '30d') {
      // Sort by month key (e.g., "2025-11")
      return a[1].sort_key.localeCompare(b[1].sort_key);
    }
    return 0;
  });
  
  // Convert sorted entries to periodData array
  const periodData = sortedPeriodEntries.map(([_, item]) => {
    const combinedVolume = item.onramp_volume_usd + item.offramp_volume_usd;
    const averageVolume = item.total_transactions > 0 ? combinedVolume / item.total_transactions : 0;
    const uniqueUsers = item.unique_customers ? item.unique_customers.size : 0;
    
    return {
      date: item.period_label,
      total_transactions: item.total_transactions,
      total_onramps: item.total_onramps,
      total_offramps: item.total_offramps,
      unique_users: uniqueUsers,
      onramp_volume_usd: item.onramp_volume_usd.toFixed(2),
      offramp_volume_usd: item.offramp_volume_usd.toFixed(2),
      combined_volume_usd: combinedVolume.toFixed(2),
      average_volume_usd: averageVolume.toFixed(2),
      is_ongoing: item.is_ongoing
    };
  });
  
  // Calculate combined volume and average volume
  const combinedVolumeUsd = totalOnrampVolume + totalOfframpVolume;
  const averageVolumeUsd = totalTransactions > 0 ? combinedVolumeUsd / totalTransactions : 0;
  
  // Debug logging for 30d period
  if (period === '30d') {
    console.log(`   📈 30d Summary Totals:`);
    console.log(`      Onramp Volume: ${totalOnrampVolume.toFixed(2)}`);
    console.log(`      Offramp Volume: ${totalOfframpVolume.toFixed(2)}`);
    console.log(`      Combined Volume: ${combinedVolumeUsd.toFixed(2)}`);
    console.log(`      Date range used: ${cardStartDate} to ${cardEndDate}`);
    
    // Log November-specific data if present
    const novemberData = periodData.find(p => p.date && p.date.toLowerCase().includes('nov'));
    if (novemberData) {
      console.log(`      📅 November in graph:`, {
        date: novemberData.date,
        onramp: novemberData.onramp_volume_usd,
        offramp: novemberData.offramp_volume_usd,
        combined: novemberData.combined_volume_usd,
      });
    }
  }
  
  return {
    period,
    summary: {
      total_transactions: totalTransactions,
      total_onramps: totalOnramps,
      total_offramps: totalOfframps,
      unique_users: uniqueUsers,
      onramp_volume_usd: totalOnrampVolume.toFixed(2),
      offramp_volume_usd: totalOfframpVolume.toFixed(2),
      combined_volume_usd: combinedVolumeUsd.toFixed(2),
      average_volume_usd: averageVolumeUsd.toFixed(2)
    },
    daily_data: periodData, // Now contains weekly/monthly aggregated data
    date_range: {
      start_date: cardStartDate, // Card data range (last 7d/30d)
      end_date: cardEndDate,
      graph_start_date: graphStartDate, // Graph data range (from 2025-11-02 for 7d, from 2025-01-01 for 30d)
      graph_end_date: graphEndDate
    },
    filters_applied: {
      customer_id: customer_id || null,
      status
    },
    generated_at: new Date().toISOString()
  };
}

module.exports = { fetchIronPeriodSummary };

