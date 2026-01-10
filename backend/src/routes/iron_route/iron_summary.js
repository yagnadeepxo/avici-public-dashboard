const express = require("express");
const { fetchIronSummary } = require("../../services/iron_service/fetch_iron_summary");
const { fetchIronDailySummary } = require("../../services/iron_service/fetch_iron_daily_summary");
const { fetchIronPeriodSummary } = require("../../services/iron_service/fetch_iron_period_summary");

const router = express.Router();

/**
 * Validate ISO 8601 date format (YYYY-MM-DD or full timestamp)
 */
function isValidDate(dateString) {
  if (!dateString) return true; // Allow empty/null
  
  // Check for YYYY-MM-DD format
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyRegex.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  
  // Check for full ISO 8601 timestamp
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * GET /api/iron/summary
 * Query Parameters:
 * - customer_id: Filter by specific customer (optional)
 * - start_date: Filter from this date (ISO 8601, optional)
 * - end_date: Filter until this date (ISO 8601, optional)
 * - status: Filter by status (default: 'Completed')
 */
router.get("/summary", async (req, res) => {
  try {
    const { customer_id, start_date, end_date, status } = req.query;
    
    // Validate date formats
    if (start_date && !isValidDate(start_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid start_date format. Expected ISO 8601 (YYYY-MM-DD or full timestamp)"
      });
    }
    
    if (end_date && !isValidDate(end_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid end_date format. Expected ISO 8601 (YYYY-MM-DD or full timestamp)"
      });
    }
    
    // Validate date range
    if (start_date && end_date) {
      const startTime = new Date(start_date).getTime();
      const endTime = new Date(end_date).getTime();
      
      if (startTime > endTime) {
        return res.status(400).json({
          success: false,
          error: "start_date must be before or equal to end_date"
        });
      }
    }
    
    // Build filters object
    const filters = {};
    if (customer_id) filters.customer_id = customer_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (status) filters.status = status;
    
    // Call service function
    const result = await fetchIronSummary(filters);
    
    // Return successful response
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error("❌ Error in /api/iron/summary:", error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      generated_at: new Date().toISOString()
    });
  }
});

/**
 * GET /api/iron/daily-summary
 * Query Parameters (Optional):
 * - start_date: Start date (ISO 8601 format, optional - if not provided, gets all data)
 * - end_date: End date (ISO 8601 format, optional - if not provided, gets all data)
 * - customer_id: Filter by specific customer (optional)
 * - status: Filter by status (default: 'Completed')
 * 
 * Returns daily summaries for each date from start_date to end_date (inclusive).
 * If start_date and end_date are not provided, returns summaries for all available dates.
 */
router.get("/daily-summary", async (req, res) => {
  try {
    const { customer_id, start_date, end_date, status } = req.query;
    
    // Validate date formats if provided
    if (start_date && !isValidDate(start_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid start_date format. Expected ISO 8601 (YYYY-MM-DD or full timestamp)"
      });
    }
    
    if (end_date && !isValidDate(end_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid end_date format. Expected ISO 8601 (YYYY-MM-DD or full timestamp)"
      });
    }
    
    // Validate date range if both are provided
    if (start_date && end_date) {
      const startTime = new Date(start_date).getTime();
      const endTime = new Date(end_date).getTime();
      
      if (startTime > endTime) {
        return res.status(400).json({
          success: false,
          error: "start_date must be before or equal to end_date"
        });
      }
    }
    
    // Build filters object
    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (customer_id) filters.customer_id = customer_id;
    if (status) filters.status = status;
    
    // Call service function
    const result = await fetchIronDailySummary(filters);
    
    // Return successful response
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error("❌ Error in /api/iron/daily-summary:", error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      generated_at: new Date().toISOString()
    });
  }
});

/**
 * GET /api/iron/period-summary
 * Query Parameters:
 * - period: Period type - '7d' or '30d' (required)
 * - customer_id: Filter by specific customer (optional)
 * - status: Filter by status (default: 'Completed')
 * 
 * Returns aggregated summary for the period (including current day) and daily breakdown for graphs
 */
router.get("/period-summary", async (req, res) => {
  console.log("📊 Period summary route called with params:", req.query);
  try {
    const { period, customer_id, status } = req.query;
    
    // Validate required parameters
    if (!period) {
      return res.status(400).json({
        success: false,
        error: "period parameter is required. Must be '24h', '7d', or '30d'"
      });
    }
    
    if (period !== '24h' && period !== '7d' && period !== '30d') {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be '24h', '7d', or '30d'"
      });
    }
    
    // Build filters object
    const filters = { period };
    if (customer_id) filters.customer_id = customer_id;
    if (status) filters.status = status;
    
    // Call service function
    const result = await fetchIronPeriodSummary(filters);
    
    // Return successful response
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error("❌ Error in /api/iron/period-summary:", error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      generated_at: new Date().toISOString()
    });
  }
});

module.exports = router;

