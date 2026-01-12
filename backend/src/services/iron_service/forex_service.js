const axios = require("axios");

/**
 * In-memory cache for forex rates (date -> rate)
 * Historical rates never change, so cache indefinitely
 * Shared across all modules that need forex rates
 */
const forexCache = new Map();

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
 * Uses in-memory cache to avoid redundant API calls
 */
async function fetchForexRate(date) {
  // Check cache first
  if (forexCache.has(date)) {
    return forexCache.get(date);
  }
  
  // Fetch from API if not cached
  const rate = await retryWithBackoff(async () => {
    const response = await axios.get(
      `https://api.frankfurter.dev/v1/${date}?from=EUR&to=USD`
    );
    return response.data.rates.USD;
  });
  
  // Store in cache (never expires - historical rates are fixed)
  forexCache.set(date, rate);
  return rate;
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

module.exports = {
  fetchForexRate,
  fetchForexRates,
};

