const { supabase } = require("../../db");
const { fetchForexRates } = require("./forex_service");

/**
 * Parse JSONB field safely
 */
function parseJSONB(field, fieldName, transactionId) {
  try {
    if (typeof field === 'string') {
      return JSON.parse(field);
    }
    return field;
  } catch (error) {
    console.warn(`⚠️  Malformed ${fieldName} in transaction ${transactionId}`);
    return null;
  }
}

/**
 * Classify transaction as onramp or offramp
 */
function classifyTransaction(sourceAmount, destinationAmount) {
  const sourceType = sourceAmount?.currency?.type;
  const destType = destinationAmount?.currency?.type;
  
  if (!sourceType || !destType) {
    return null;
  }
  
  // Onramp: Fiat → Crypto
  if (sourceType === 'Fiat' && destType === 'Crypto') {
    return 'onramp';
  }
  
  // Offramp: Crypto → Fiat
  if (sourceType === 'Crypto' && destType === 'Fiat') {
    return 'offramp';
  }
  
  return null;
}

/**
 * Extract currency token or code
 */
function getCurrency(amount) {
  if (amount?.currency?.type === 'Crypto') {
    return amount.currency.token || null;
  }
  if (amount?.currency?.type === 'Fiat') {
    return amount.currency.code || null;
  }
  return null;
}

/**
 * Convert transaction amount to USD
 */
function convertToUSD(transaction, type, forexRates) {
  const { source_amount, destination_amount, exchange_rate, created_at } = transaction;
  
  // Extract date for forex lookup
  const date = created_at.split('T')[0];
  
  if (type === 'onramp') {
    // Fiat → Crypto
    const destCurrency = getCurrency(destination_amount);
    
    if (destCurrency === 'USDC') {
      // EUR → USDC conversion
      const usdcAmount = parseFloat(destination_amount.amount);
      return usdcAmount;
    } else if (destCurrency === 'EURC') {
      // EUR → EURC conversion
      const eurcAmount = parseFloat(destination_amount.amount);
      const rate = forexRates[date];
      if (!rate) {
        throw new Error(`Missing forex rate for date ${date}`);
      }
      return eurcAmount * rate;
    }
  } else if (type === 'offramp') {
    // Crypto → Fiat
    const sourceCurrency = getCurrency(source_amount);
    
    if (sourceCurrency === 'USDC') {
      // USDC → EUR conversion
      return parseFloat(source_amount.amount);
    } else if (sourceCurrency === 'EURC') {
      // EURC → EUR conversion
      const eurcAmount = parseFloat(source_amount.amount);
      const rate = forexRates[date];
      if (!rate) {
        throw new Error(`Missing forex rate for date ${date}`);
      }
      return eurcAmount * rate;
    }
  }
  
  return 0;
}

/**
 * Generate array of dates between start and end (inclusive)
 */
function generateDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to midnight for accurate date comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Main function to fetch and calculate iron transaction summary by date
 */
async function fetchIronDailySummary(filters = {}) {
  const { customer_id, start_date, end_date, status = 'Completed' } = filters;
  
  console.log(`🔍 Fetching iron transactions with filters:`, filters);
  
  // Step 1: Query the optimized view (already filtered and classified)
  let query = supabase
    .from('iron_transactions_classified')
    .select('id, created_at, transaction_type, transaction_date, source_amount, destination_amount, exchange_rate, customer_id, eur_currency, eur_amount')
    .not('transaction_type', 'is', null); // Only get valid transactions
  
  // Apply date filters if provided
  if (start_date) {
    const startDateWithTime = start_date.includes('T') ? start_date : `${start_date}T00:00:00.000Z`;
    query = query.gte('created_at', startDateWithTime);
  }
  
  if (end_date) {
    const endDateWithTime = end_date.includes('T') ? end_date : `${end_date}T23:59:59.999Z`;
    query = query.lte('created_at', endDateWithTime);
  }
  
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }
  
  const { data: transactions, error } = await query;
  
  if (error) {
    console.error('❌ Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  console.log(`📦 Retrieved ${transactions.length} transactions from optimized view`);
  
  // Step 2: Group transactions by date using transaction_date from view
  const transactionsByDate = {};
  let minDate = null;
  let maxDate = null;
  
  for (const transaction of transactions) {
    // Use transaction_date from view (already calculated!)
    const date = transaction.transaction_date || transaction.created_at.split('T')[0];
    if (!transactionsByDate[date]) {
      transactionsByDate[date] = [];
    }
    transactionsByDate[date].push(transaction);
    
    // Track min and max dates
    if (!minDate || date < minDate) {
      minDate = date;
    }
    if (!maxDate || date > maxDate) {
      maxDate = date;
    }
  }
  
  // Step 3: Determine date range
  // If start_date and end_date are provided, use them
  // Otherwise, use the min and max dates from the data
  let finalStartDate = start_date;
  let finalEndDate = end_date;
  
  if (!finalStartDate || !finalEndDate) {
    if (transactions.length === 0) {
      // No transactions found, return empty result
      return {
        daily_summaries: [],
        filters_applied: {
          customer_id: customer_id || null,
          start_date: start_date || null,
          end_date: end_date || null,
          status
        },
        generated_at: new Date().toISOString()
      };
    }
    
    // Use the date range from the data
    finalStartDate = minDate;
    finalEndDate = maxDate;
    console.log(`📅 Using date range from data: ${finalStartDate} to ${finalEndDate}`);
  }
  
  // Step 4: Generate date range and ensure all dates are included (even with 0 transactions)
  const dateRange = generateDateRange(finalStartDate, finalEndDate);
  
  // Step 4: Collect all unique dates that need forex rates (using eur_currency from view)
  const eurTransactionDates = [];
  
  for (const transaction of transactions) {
    // Use eur_currency from view to identify EUR transactions
    if (transaction.eur_currency === 'EUR') {
      const date = transaction.transaction_date || transaction.created_at.split('T')[0];
      eurTransactionDates.push(date);
    }
  }
  
  // Step 5: Fetch forex rates for EUR/EURC transactions
  let forexRates = {};
  if (eurTransactionDates.length > 0) {
    try {
      forexRates = await fetchForexRates(eurTransactionDates);
    } catch (error) {
      console.error('❌ Forex rate fetching failed:', error);
      throw new Error(`Failed to fetch forex rates: ${error.message}`);
    }
  }
  
  // Step 6: Process transactions by date
  const dailySummaries = [];
  
  for (const date of dateRange) {
    // Get transactions for this date
    const dateTransactions = transactionsByDate[date] || [];
    
    // Initialize counters for this date
    let totalTransactions = 0;
    let totalOnramps = 0;
    let totalOfframps = 0;
    let onrampVolumeUsd = 0;
    let offrampVolumeUsd = 0;
    const uniqueCustomers = new Set();
    
    // Process transactions for this date
    for (const transaction of dateTransactions) {
      // Parse JSONB fields for volume calculation
      const sourceAmount = parseJSONB(transaction.source_amount, 'source_amount', transaction.id);
      const destinationAmount = parseJSONB(transaction.destination_amount, 'destination_amount', transaction.id);
      
      if (!sourceAmount || !destinationAmount) {
        continue;
      }
      
      // Use transaction_type from view (already classified!)
      const type = transaction.transaction_type;
      
      if (!type) {
        continue;
      }
      
      // Convert to USD
      try {
        const usdAmount = convertToUSD({
          ...transaction,
          source_amount: sourceAmount,
          destination_amount: destinationAmount
        }, type, forexRates);
        
        totalTransactions++;
        
        // Track unique customers
        if (transaction.customer_id) {
          uniqueCustomers.add(transaction.customer_id);
        }
        
        if (type === 'onramp') {
          totalOnramps++;
          onrampVolumeUsd += usdAmount;
        } else if (type === 'offramp') {
          totalOfframps++;
          offrampVolumeUsd += usdAmount;
        }
      } catch (error) {
        // Skip transactions that fail conversion
        console.warn(`⚠️  Skipping transaction ${transaction.id} for date ${date}:`, error.message);
      }
    }
    
    // Calculate combined volume and average volume
    const combinedVolumeUsd = onrampVolumeUsd + offrampVolumeUsd;
    const averageVolumeUsd = totalTransactions > 0 ? combinedVolumeUsd / totalTransactions : 0;
    
    // Add daily summary
    dailySummaries.push({
      date: date,
      summary: {
        total_transactions: totalTransactions,
        total_onramps: totalOnramps,
        total_offramps: totalOfframps,
        unique_users: uniqueCustomers.size,
        onramp_volume_usd: onrampVolumeUsd.toFixed(2),
        offramp_volume_usd: offrampVolumeUsd.toFixed(2),
        combined_volume_usd: combinedVolumeUsd.toFixed(2),
        average_volume_usd: averageVolumeUsd.toFixed(2)
      }
    });
  }
  
  console.log(`✅ Daily summaries calculated for ${dailySummaries.length} dates`);
  
  return {
    daily_summaries: dailySummaries,
    filters_applied: {
      customer_id: customer_id || null,
      start_date: finalStartDate || null,
      end_date: finalEndDate || null,
      status
    },
    generated_at: new Date().toISOString()
  };
}

module.exports = { fetchIronDailySummary };

