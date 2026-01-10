const axios = require("axios");
const { supabase } = require("../../db");

/**
 * Retry logic for API calls with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`⚠️  Retry attempt ${i + 1} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Fetch EUR to USD exchange rate for a specific date
 */
async function fetchForexRate(date) {
  return retryWithBackoff(async () => {
    const response = await axios.get(
      `https://api.frankfurter.dev/v1/${date}?from=EUR&to=USD`
    );
    return response.data.rates.USD;
  });
}

/**
 * Fetch forex rates for multiple dates in parallel
 */
async function fetchForexRates(dates) {
  const rateMap = {};
  const uniqueDates = [...new Set(dates)];
  
  console.log(`📊 Fetching forex rates for ${uniqueDates.length} unique dates...`);
  
  const ratePromises = uniqueDates.map(async (date) => {
    try {
      const rate = await fetchForexRate(date);
      rateMap[date] = rate;
      console.log(`✅ Fetched rate for ${date}: ${rate}`);
    } catch (error) {
      console.error(`❌ Failed to fetch rate for ${date}:`, error.message);
      throw new Error(`Failed to fetch forex rate for date ${date}: ${error.message}`);
    }
  });
  
  await Promise.all(ratePromises);
  return rateMap;
}

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
      // Use exchange_rate if available, else calculate from amounts
      if (exchange_rate) {
        const eurAmount = parseFloat(source_amount.amount);
        // exchange_rate is EUR/USDC, so USDC = EUR * rate
        // But USDC is 1:1 with USD, so we need to convert EUR to USD
        // Actually, for onramp EUR→USDC, the destination amount is in USDC which equals USD
        const usdcAmount = parseFloat(destination_amount.amount);
        return usdcAmount;
      } else {
        // Fallback to destination amount (USDC = USD)
        return parseFloat(destination_amount.amount);
      }
    } else if (destCurrency === 'EURC') {
      // EUR → EURC conversion
      // destination_amount is in EURC (which represents EUR value)
      // Need to convert EUR to USD
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
      // source_amount is in USDC which equals USD
      return parseFloat(source_amount.amount);
    } else if (sourceCurrency === 'EURC') {
      // EURC → EUR conversion
      // source_amount is in EURC
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
 * Main function to fetch and calculate iron transaction summary
 */
async function fetchIronSummary(filters = {}) {
  const { customer_id, start_date, end_date, status = 'Completed' } = filters;
  
  console.log(`🔍 Fetching iron transactions with filters:`, filters);
  
  // Step 1: Query the optimized view (already filtered and classified)
  let query = supabase
    .from('iron_transactions_classified')
    .select('id, created_at, transaction_type, transaction_date, source_amount, destination_amount, exchange_rate, customer_id, eur_currency, eur_amount')
    .not('transaction_type', 'is', null); // Only get valid transactions
  
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }
  
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  
  if (end_date) {
    query = query.lte('created_at', end_date);
  }
  
  const { data: transactions, error } = await query;
  
  if (error) {
    console.error('❌ Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  console.log(`📦 Retrieved ${transactions.length} transactions from optimized view`);
  
  // Initialize counters
  let totalTransactions = 0;
  let totalOnramps = 0;
  let totalOfframps = 0;
  let onrampVolumeUsd = 0;
  let offrampVolumeUsd = 0;
  const uniqueCustomers = new Set();
  
  // Track skipped transactions for debugging
  const skippedTransactions = [];
  
  // Step 2: Collect EUR transaction dates for forex rates (using eur_currency from view)
  const eurTransactionDates = [];
  
  for (const transaction of transactions) {
    // Track unique customers
    if (transaction.customer_id) {
      uniqueCustomers.add(transaction.customer_id);
    }
    
    // Collect dates for EUR/EURC transactions (using eur_currency from view)
    if (transaction.eur_currency === 'EUR') {
      const date = transaction.transaction_date || transaction.created_at.split('T')[0];
      eurTransactionDates.push(date);
    }
  }
  
  // Step 3: Fetch forex rates for EUR/EURC transactions
  let forexRates = {};
  if (eurTransactionDates.length > 0) {
    try {
      forexRates = await fetchForexRates([...new Set(eurTransactionDates)]);
    } catch (error) {
      console.error('❌ Forex rate fetching failed:', error);
      throw new Error(`Failed to fetch forex rates: ${error.message}`);
    }
  }
  
  // Step 4: Process each transaction and calculate USD amounts
  // Transaction type is already classified in the view!
  const conversionErrors = [];
  for (const transaction of transactions) {
    // Parse JSONB fields for volume calculation
    const sourceAmount = parseJSONB(transaction.source_amount, 'source_amount', transaction.id);
    const destinationAmount = parseJSONB(transaction.destination_amount, 'destination_amount', transaction.id);
    
    if (!sourceAmount || !destinationAmount) {
      const reason = 'Malformed JSONB data';
      console.warn(`⚠️  Skipping transaction ${transaction.id}: ${reason}`);
      skippedTransactions.push({ id: transaction.id, reason });
      continue;
    }
    
    try {
      // Use transaction_type from view (already classified!)
      const type = transaction.transaction_type;
      const usdAmount = convertToUSD({
        ...transaction,
        source_amount: sourceAmount,
        destination_amount: destinationAmount
      }, type, forexRates);
      
      totalTransactions++;
      
      if (type === 'onramp') {
        totalOnramps++;
        onrampVolumeUsd += usdAmount;
      } else if (type === 'offramp') {
        totalOfframps++;
        offrampVolumeUsd += usdAmount;
      }
    } catch (error) {
      const reason = `USD conversion failed: ${error.message}`;
      console.warn(`⚠️  Skipping transaction ${transaction.id}: ${reason}`);
      conversionErrors.push({ id: transaction.id, reason });
    }
  }
  
  if (skippedTransactions.length > 0) {
    console.log(`⚠️  Skipped ${skippedTransactions.length} transaction(s) during processing:`);
    skippedTransactions.forEach(skipped => {
      console.log(`   - ${skipped.id}: ${skipped.reason}`);
    });
  }
  
  if (conversionErrors.length > 0) {
    console.log(`⚠️  ${conversionErrors.length} transaction(s) failed USD conversion:`);
    conversionErrors.forEach(err => {
      console.log(`   - ${err.id}: ${err.reason}`);
    });
  }
  
  // Step 5: Calculate combined volume and average volume
  const combinedVolumeUsd = onrampVolumeUsd + offrampVolumeUsd;
  const averageVolumeUsd = totalTransactions > 0 ? combinedVolumeUsd / totalTransactions : 0;
  
  // Step 6: Format response
  const summary = {
    total_transactions: totalTransactions,
    total_onramps: totalOnramps,
    total_offramps: totalOfframps,
    unique_users: uniqueCustomers.size,
    onramp_volume_usd: onrampVolumeUsd.toFixed(2),
    offramp_volume_usd: offrampVolumeUsd.toFixed(2),
    combined_volume_usd: combinedVolumeUsd.toFixed(2),
    average_volume_usd: averageVolumeUsd.toFixed(2)
  };
  
  // Log summary with breakdown
  console.log('✅ Summary calculated successfully (using optimized view):');
  console.log(`   Total transactions: ${totalTransactions}`);
  console.log(`   - Onramps: ${totalOnramps}`);
  console.log(`   - Offramps: ${totalOfframps}`);
  console.log(`   - Unique users: ${uniqueCustomers.size}`);
  console.log(`   - Skipped: ${skippedTransactions.length + conversionErrors.length}`);
  console.log(`   Onramp volume: $${onrampVolumeUsd.toFixed(2)}`);
  console.log(`   Offramp volume: $${offrampVolumeUsd.toFixed(2)}`);
  
  return {
    summary,
    filters_applied: {
      customer_id: customer_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      status
    },
    generated_at: new Date().toISOString()
  };
}

module.exports = { fetchIronSummary };

