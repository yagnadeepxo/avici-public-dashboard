# Iron Transactions API Documentation

## Overview

The Iron Transactions API provides aggregated statistics and analytics for iron transactions stored in the `iron_transactions` table. The API supports filtering by customer, date ranges, and transaction status, and includes automatic USD conversion for multi-currency transactions.

## Base URL

All endpoints are prefixed with `/api/iron`

---

## Endpoints

### 1. GET `/api/iron/summary`

Returns aggregated summary statistics for iron transactions with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `customer_id` | string | No | - | Filter by specific customer ID |
| `start_date` | string (ISO 8601) | No | - | Filter transactions from this date (inclusive). Accepts `YYYY-MM-DD` or full ISO timestamp |
| `end_date` | string (ISO 8601) | No | - | Filter transactions until this date (inclusive). Accepts `YYYY-MM-DD` or full ISO timestamp |
| `status` | string | No | `'Completed'` | Filter by transaction status |

#### Response Format

```json
{
  "success": true,
  "summary": {
    "total_transactions": 150,
    "total_onramps": 75,
    "total_offramps": 75,
    "unique_users": 42,
    "onramp_volume_usd": "125000.50",
    "offramp_volume_usd": "118500.25",
    "combined_volume_usd": "243500.75",
    "average_volume_usd": "1623.34"
  },
  "filters_applied": {
    "customer_id": null,
    "start_date": null,
    "end_date": null,
    "status": "Completed"
  },
  "generated_at": "2026-01-05T10:30:00Z"
}
```

#### Data Retrieval Logic

1. **Database Query**:
   ```sql
   SELECT id, created_at, source_amount, destination_amount, exchange_rate
   FROM iron_transactions
   WHERE status = 'Completed'
     AND (customer_id = ? OR customer_id IS NULL)
     AND (created_at >= ? OR start_date IS NULL)
     AND (created_at <= ? OR end_date IS NULL)
   ```

2. **Transaction Processing**:
   - Parse JSONB fields: `source_amount` and `destination_amount`
   - Skip transactions with malformed JSONB data
   - Classify each transaction as onramp or offramp
   - Extract dates for EUR/EURC transactions (for forex rate fetching)

3. **Forex Rate Fetching**:
   - Collect all unique dates from EUR/EURC transactions
   - Fetch EUR→USD rates in parallel from Frankfurter API
   - Cache rates in memory: `{ '2025-11-20': 1.1514, ... }`

4. **USD Conversion**:
   - **USDC**: 1:1 conversion (USDC amount = USD amount)
   - **EURC/EUR**: `USD_amount = EUR_amount × forex_rate[date]`
   - Skip transactions that fail conversion (log warning)

5. **Aggregation**:
   - Count total transactions (only successfully processed)
   - Sum onramp volumes in USD → `onramp_volume_usd`
   - Sum offramp volumes in USD → `offramp_volume_usd`
   - Calculate `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
   - Calculate `average_volume_usd = combined_volume_usd / total_transactions`

#### Calculation Formulas

- `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
- `average_volume_usd = combined_volume_usd / total_transactions` (returns `"0.00"` if `total_transactions = 0`)

#### Example Request

```
GET /api/iron/summary?start_date=2025-11-20&end_date=2025-11-30&status=Completed
```

#### Error Responses

- **400 Bad Request**: Invalid date format or invalid date range (start_date > end_date)
- **500 Internal Server Error**: Database query failure or forex API failure

---

### 2. GET `/api/iron/daily-summary`

Returns daily aggregated summaries for each date within a specified date range.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | string (ISO 8601) | No | - | Start date (if not provided, uses earliest transaction date) |
| `end_date` | string (ISO 8601) | No | - | End date (if not provided, uses latest transaction date) |
| `customer_id` | string | No | - | Filter by specific customer ID |
| `status` | string | No | `'Completed'` | Filter by transaction status |

**Note**: If both `start_date` and `end_date` are omitted, returns summaries for all available dates.

#### Response Format

```json
{
  "success": true,
  "daily_summaries": [
    {
      "date": "2025-11-20",
      "summary": {
        "total_transactions": 5,
        "total_onramps": 2,
        "total_offramps": 3,
        "unique_users": 4,
        "onramp_volume_usd": "250.50",
        "offramp_volume_usd": "180.25",
        "combined_volume_usd": "430.75",
        "average_volume_usd": "86.15"
      }
    },
    {
      "date": "2025-11-21",
      "summary": {
        "total_transactions": 3,
        "total_onramps": 1,
        "total_offramps": 2,
        "unique_users": 2,
        "onramp_volume_usd": "100.00",
        "offramp_volume_usd": "50.00",
        "combined_volume_usd": "150.00",
        "average_volume_usd": "50.00"
      }
    }
  ],
  "filters_applied": {
    "customer_id": null,
    "start_date": "2025-11-20",
    "end_date": "2025-11-22",
    "status": "Completed"
  },
  "generated_at": "2026-01-05T10:30:00Z"
}
```

#### Data Retrieval Logic

1. **Database Query**:
   ```sql
   SELECT id, created_at, source_amount, destination_amount, exchange_rate
   FROM iron_transactions
   WHERE status = 'Completed'
     AND (customer_id = ? OR customer_id IS NULL)
     AND (created_at >= ? OR start_date IS NULL)
     AND (created_at <= ? OR end_date IS NULL)
   ```
   - If `start_date` provided without time: Appends `T00:00:00.000Z`
   - If `end_date` provided without time: Appends `T23:59:59.999Z`

2. **Date Range Determination**:
   - If both `start_date` and `end_date` provided: Use provided range
   - If not provided: Query all transactions, extract min/max dates from `created_at`
   - Generate all dates in range (inclusive), including dates with 0 transactions

3. **Transaction Grouping**:
   - Extract date from `created_at`: `YYYY-MM-DD`
   - Group transactions by date: `{ '2025-11-20': [tx1, tx2, ...], ... }`

4. **Forex Rate Fetching**:
   - Extract unique dates from EUR/EURC transactions
   - Fetch EUR→USD rates in parallel from Frankfurter API
   - Cache rates: `{ '2025-11-20': 1.1514, ... }`

5. **Daily Processing** (for each date):
   - Process all transactions for that date
   - Classify as onramp/offramp
   - Convert to USD (USDC 1:1 or EUR×rate)
   - Aggregate:
     - Count transactions, onramps, offramps
     - Sum volumes
     - Calculate `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
     - Calculate `average_volume_usd = combined_volume_usd / total_transactions`

6. **Response Generation**:
   - Include all dates in range (even with 0 transactions)
   - Sort by date (ascending)

#### Calculation Formulas

For each date:
- `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
- `average_volume_usd = combined_volume_usd / total_transactions` (returns `"0.00"` if `total_transactions = 0`)
- `unique_users = COUNT(DISTINCT customer_id)` for all transactions on that date

#### Example Requests

```
# With date range
GET /api/iron/daily-summary?start_date=2025-11-20&end_date=2025-11-22

# All available dates
GET /api/iron/daily-summary

# With customer filter
GET /api/iron/daily-summary?start_date=2025-11-20&customer_id=019aa2d9-17f8-7a21-9557-08edbc40742f
```

#### Error Responses

- **400 Bad Request**: Invalid date format or invalid date range
- **500 Internal Server Error**: Database query failure or forex API failure

---

### 3. GET `/api/iron/period-summary`

Returns aggregated summary for specific time periods (24h, 7d, or 30d) with period-specific breakdowns for graphs.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | **Yes** | - | Period type: `'24h'`, `'7d'`, or `'30d'` |
| `customer_id` | string | No | - | Filter by specific customer ID |
| `status` | string | No | `'Completed'` | Filter by transaction status |

#### Response Format

```json
{
  "success": true,
  "period": "7d",
  "summary": {
    "total_transactions": 71,
    "total_onramps": 35,
    "total_offramps": 36,
    "unique_users": 28,
    "onramp_volume_usd": "125000.50",
    "offramp_volume_usd": "118500.25",
    "combined_volume_usd": "243500.75",
    "average_volume_usd": "3429.59"
  },
  "daily_data": [
    {
      "date": "Nov 20-26",
      "total_transactions": 16,
      "total_onramps": 5,
      "total_offramps": 11,
      "unique_users": 10,
      "onramp_volume_usd": "1294.53",
      "offramp_volume_usd": "8315.18",
      "combined_volume_usd": "9609.71",
      "average_volume_usd": "600.61",
      "is_ongoing": false
    },
    {
      "date": "Nov 27 - Dec 3",
      "total_transactions": 1,
      "total_onramps": 0,
      "total_offramps": 1,
      "unique_users": 1,
      "onramp_volume_usd": "0.00",
      "offramp_volume_usd": "15001.00",
      "combined_volume_usd": "15001.00",
      "average_volume_usd": "15001.00",
      "is_ongoing": false
    }
  ],
  "date_range": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-08",
    "graph_start_date": "2025-11-20",
    "graph_end_date": "2026-01-07"
  },
  "filters_applied": {
    "customer_id": null,
    "status": "Completed"
  },
  "generated_at": "2026-01-07T10:30:00Z"
}
```

#### Data Retrieval Logic

The endpoint uses **two separate data fetches**:

1. **Card Data** (for `summary` object): Aggregated totals for the period
2. **Graph Data** (for `daily_data` array): Period-specific breakdowns for visualization

---

#### Period: `24h`

**Card Data**:
- **Query Method**: Uses `fetchIronSummary` with timestamp-based query
- **Date Range**: Last 24 hours from current time
  - Start: `now - 24 hours` (ISO timestamp)
  - End: `now` (ISO timestamp)
- **Processing**: Direct aggregation from transactions in the 24-hour window
- **Result**: Total transactions, volumes, and averages for last 24 hours

**Graph Data**:
- **Query Method**: Uses `fetchIronDailySummary` with date-based query
- **Date Range**: Last 24 days, excluding today (up to yesterday)
  - Start: `yesterday - 23 days` (date only, `YYYY-MM-DD`)
  - End: `yesterday` (date only, `YYYY-MM-DD`)
- **Processing**: 
  - Fetches daily summaries for each of the 24 days
  - Each day becomes its own period (no grouping)
  - Formats date labels as `"MMM D"` (e.g., "Jan 7")
- **Ongoing Flag**: `is_ongoing: true` for yesterday's date

**Example** (if today is 2026-01-08 15:30:00):
- Card: `2026-01-07T15:30:00Z` to `2026-01-08T15:30:00Z`
- Graph: `2025-12-15` to `2026-01-07` (24 days, excluding today)

---

#### Period: `7d`

**Card Data**:
- **Query Method**: Uses `fetchIronDailySummary` with date-based query
- **Date Range**: Last 7 days including today
  - Start: `today - 6 days` (date only, `YYYY-MM-DD`)
  - End: `today` (date only, `YYYY-MM-DD`, automatically converted to `T23:59:59.999Z`)
- **Processing**: 
  - Fetches daily summaries for last 7 days
  - Sums all daily totals for card display
- **Result**: Total transactions, volumes, and averages for last 7 days

**Graph Data**:
- **Query Method**: Uses `fetchIronDailySummary` with date-based query
- **Date Range**: Fixed start date to today
  - Start: `2025-11-02` (fixed, hardcoded to match card spends week boundaries)
  - End: `today` (date only, `YYYY-MM-DD`)
- **Processing**:
  - Fetches all daily summaries from `2025-11-02` to today
  - Groups into weekly periods (7-day chunks, Sunday to Saturday):
    - Week 0: 2025-11-02 to 2025-11-08 (Sunday to Saturday)
    - Week 1: 2025-11-09 to 2025-11-15
    - Week 2: 2025-11-16 to 2025-11-22
    - etc.
  - Week number calculation: `floor((date - 2025-11-02) / 7)`
  - Aggregates all daily data within each week:
    - Sums transactions, onramps, offramps, volumes
    - Calculates `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
    - Calculates `average_volume_usd = combined_volume_usd / total_transactions`
  - Labels: `"MMM D-D"` or `"MMM D - MMM D"` (e.g., "Nov 2-8" or "Nov 9 - Nov 15")
- **Ongoing Flag**: `is_ongoing: true` if today falls within the week's date range

**Example** (if today is 2026-01-08):
- Card: `2026-01-02` to `2026-01-08` (last 7 days)
- Graph: `2025-11-02` to `2026-01-08` (all weeks from start date)

---

#### Period: `30d`

**Card Data**:
- **Query Method**: Uses `fetchIronDailySummary` with date-based query
- **Date Range**: Last 30 days including today
  - Start: `today - 29 days` (date only, `YYYY-MM-DD`)
  - End: `today` (date only, `YYYY-MM-DD`, automatically converted to `T23:59:59.999Z`)
- **Processing**: 
  - Fetches daily summaries for last 30 days
  - Sums all daily totals for card display
- **Result**: Total transactions, volumes, and averages for last 30 days

**Graph Data**:
- **Query Method**: Uses `fetchIronDailySummary` with date-based query
- **Date Range**: Fixed start date to today
  - Start: `2025-11-20` (fixed, hardcoded)
  - End: `today` (date only, `YYYY-MM-DD`)
- **Processing**:
  - Fetches all daily summaries from `2025-11-20` to today
  - Groups into monthly periods:
    - November 2025: All transactions in Nov 2025
    - December 2025: All transactions in Dec 2025
    - January 2026: All transactions in Jan 2026
    - etc.
  - Month key: `"{year}-{month}"` (e.g., "2025-11", "2025-12")
  - Aggregates all daily data within each month:
    - Sums transactions, onramps, offramps, volumes
    - Calculates `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
    - Calculates `average_volume_usd = combined_volume_usd / total_transactions`
  - Labels: `"MMM YYYY"` (e.g., "Nov 2025", "Dec 2025")
- **Ongoing Flag**: `is_ongoing: true` if today's month matches the period's month

**Example** (if today is 2026-01-08):
- Card: `2025-12-10` to `2026-01-08` (last 30 days)
- Graph: `2025-11-20` to `2026-01-08` (all months from start date)

---

#### Calculation Formulas

**For Card Data (`summary`)**:
- `combined_volume_usd = onramp_volume_usd + offramp_volume_usd`
- `average_volume_usd = combined_volume_usd / total_transactions` (returns `"0.00"` if `total_transactions = 0`)
- `unique_users = COUNT(DISTINCT customer_id)` for all transactions in the card date range

**For Graph Data (`daily_data`)**:
- For each period (day/week/month):
  - `combined_volume_usd = sum(onramp_volume_usd) + sum(offramp_volume_usd)`
  - `average_volume_usd = combined_volume_usd / total_transactions` (returns `"0.00"` if `total_transactions = 0`)
  - `unique_users = COUNT(DISTINCT customer_id)` for all transactions whose `created_at` falls inside that period

#### Example Requests

```
# 24-hour period (last 24 hours)
GET /api/iron/period-summary?period=24h

# 7-day period (weekly aggregation)
GET /api/iron/period-summary?period=7d

# 30-day period (monthly aggregation)
GET /api/iron/period-summary?period=30d

# With customer filter
GET /api/iron/period-summary?period=7d&customer_id=019aa2d9-17f8-7a21-9557-08edbc40742f
```

#### Error Responses

- **400 Bad Request**: Missing `period` parameter or invalid period value (must be `'24h'`, `'7d'`, or `'30d'`)
- **500 Internal Server Error**: Database query failure or forex API failure

---

## Common Calculation Details

### Transaction Classification

Transactions are classified based on currency types in `source_amount` and `destination_amount` JSONB fields:

```javascript
// Onramp: Fiat → Crypto
if (source_amount.currency.type === 'Fiat' && destination_amount.currency.type === 'Crypto') {
  return 'onramp';
}

// Offramp: Crypto → Fiat
if (source_amount.currency.type === 'Crypto' && destination_amount.currency.type === 'Fiat') {
  return 'offramp';
}

// Unclassifiable: Skip transaction
return null;
```

### USD Conversion Methods

#### USDC Transactions

USDC is pegged 1:1 with USD:

- **Onramp (EUR → USDC)**: `USD_amount = destination_amount.amount` (USDC amount)
- **Offramp (USDC → EUR)**: `USD_amount = source_amount.amount` (USDC amount)

#### EURC/EUR Transactions

Requires historical forex conversion:

1. **Extract Date**: Parse `created_at` to get `YYYY-MM-DD`
2. **Fetch Rate**: 
   ```
   GET https://api.frankfurter.dev/v1/{date}?from=EUR&to=USD
   ```
3. **Parse Response**:
   ```json
   {
     "amount": 1,
     "base": "EUR",
     "date": "2025-11-20",
     "rates": {
       "USD": 1.1514
     }
   }
   ```
4. **Convert**: `USD_amount = EUR_amount × rates.USD`

**Example**:
- Transaction: 100 EUR on 2025-11-20
- Rate: 1.1514
- USD: 100 × 1.1514 = $115.14

### Forex API Error Handling

- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Failure Handling**: Returns 500 error if all retries fail
- **Weekend/Holiday Dates**: Frankfurter API automatically returns last available rate
- **Future Dates**: API returns error → handled by retry → returns 500
- **Very Old Dates**: Not supported by Frankfurter → returns 500 with error message

### Data Processing Flow

1. **Parse JSONB Fields**: Safely parse `source_amount` and `destination_amount` from JSON strings
2. **Skip Invalid Transactions**: 
   - Malformed JSONB → Skip, log warning
   - Missing currency info → Skip, log warning
   - Unable to classify → Skip, log warning
   - USD conversion failure → Skip, log warning
3. **Forex Rate Caching**: Rates fetched in parallel and cached in memory map per request
4. **USD Conversion**: Apply appropriate conversion method based on currency type
5. **Aggregation**: Sum volumes, count transactions, calculate averages

### Volume Calculations

All endpoints calculate:

- `onramp_volume_usd`: Sum of all onramp transaction amounts in USD
- `offramp_volume_usd`: Sum of all offramp transaction amounts in USD
- `combined_volume_usd`: `onramp_volume_usd + offramp_volume_usd`
- `average_volume_usd`: `combined_volume_usd / total_transactions` (returns `"0.00"` if division by zero)

### Unique Users Calculation

All endpoints expose **unique user counts** via the `unique_users` field:

- **`/summary`**:
  - `unique_users` = number of distinct `customer_id` values across all **successfully processed** transactions in the filter range.
  - Implemented as an in-memory `Set` over the queried transactions.

- **`/daily-summary`**:
  - For each date bucket:
    - `unique_users` = number of distinct `customer_id` values for transactions whose `created_at` falls on that date.
  - Implemented as a per-day `Set` over that day's transactions.

- **`/period-summary`**:
  - **Card Data (`summary.unique_users`)**:
    - For `24h`: taken directly from the `/summary` result for the last 24 hours.
    - For `7d` and `30d`: computed by querying `iron_transactions` in the card date range and counting distinct `customer_id`.
  - **Graph Data (`daily_data[i].unique_users`)**:
    - `24h`: each bar is one day → distinct `customer_id` for that date.
    - `7d`: each bar is one week → distinct `customer_id` for all transactions in that week.
    - `30d`: each bar is one month → distinct `customer_id` for all transactions in that month.
  - Implementation detail: the service queries `iron_transactions` once for the graph date range, then assigns each transaction to its period (day/week/month) and adds `customer_id` to a per-period `Set`, then exposes `unique_users = set.size`.

---

## Database Schema

The API queries the `iron_transactions` table with the following relevant fields:

- `id` (TEXT, PRIMARY KEY)
- `customer_id` (TEXT, INDEXED)
- `created_at` (TIMESTAMP WITH TIME ZONE, INDEXED)
- `source_amount` (JSONB)
- `destination_amount` (JSONB)
- `exchange_rate` (TEXT)
- `status` (TEXT, INDEXED)
- `state` (TEXT, INDEXED)

**JSONB Structure**:

For Crypto:
```json
{
  "amount": "10",
  "currency": {
    "type": "Crypto",
    "token": "USDC",
    "blockchain": "Base"
  }
}
```

For Fiat:
```json
{
  "amount": "100",
  "currency": {
    "code": "EUR",
    "type": "Fiat"
  }
}
```

---

## Performance Considerations

1. **Database Indexes**: Queries use existing indexes on `customer_id`, `created_at`, `status`
2. **Forex Rate Batching**: Rates fetched in parallel for all unique dates
3. **Single Query**: Only one database query per endpoint call (except `period-summary` which uses 2 queries)
4. **In-Memory Processing**: All aggregation done in memory after fetching data

---

## Example Usage Scenarios

### Scenario 1: Get Overall Summary

```bash
curl "http://localhost:4000/api/iron/summary"
```

Returns total statistics for all completed transactions.

### Scenario 2: Get Daily Breakdown for Date Range

```bash
curl "http://localhost:4000/api/iron/daily-summary?start_date=2025-11-20&end_date=2025-11-30"
```

Returns daily summaries for each day in the range.

### Scenario 3: Get Last 24 Hours Summary

```bash
curl "http://localhost:4000/api/iron/period-summary?period=24h"
```

Returns:
- Total summary (last 24 hours from current time)
- Daily breakdown (last 24 days, one bar per day)

### Scenario 4: Get Weekly Aggregates (7d)

```bash
curl "http://localhost:4000/api/iron/period-summary?period=7d"
```

Returns:
- Total summary (last 7 days including today)
- Weekly breakdown (one bar per week from 2025-11-20 to today)

### Scenario 5: Get Monthly Aggregates (30d)

```bash
curl "http://localhost:4000/api/iron/period-summary?period=30d"
```

Returns:
- Total summary (last 30 days including today)
- Monthly breakdown (one bar per month from 2025-11-20 to today)

### Scenario 6: Filter by Customer

```bash
curl "http://localhost:4000/api/iron/summary?customer_id=019aa2d9-17f8-7a21-9557-08edbc40742f"
```

Returns statistics for a specific customer only.

---

## Error Handling

All endpoints follow consistent error handling:

- **400 Bad Request**: Invalid parameters (date format, missing required params, invalid date range)
- **500 Internal Server Error**: 
  - Database query failures
  - Forex API failures (after retries)
  - Data processing errors

Error response format:
```json
{
  "success": false,
  "error": "Error message here",
  "generated_at": "2026-01-05T10:30:00Z"
}
```

---

## Notes

- All dates are handled in UTC
- Date ranges are inclusive (start and end dates included)
- Transactions with status other than 'Completed' are excluded by default
- Only successfully processed transactions are counted (malformed/unclassifiable transactions are skipped)
- Forex rates are fetched on-demand (not cached between requests)
- The `period-summary` endpoint graph data always starts from `2025-11-20` regardless of the period type
- For `24h` period, card data uses timestamp-based query (last 24 hours from now), while graph data uses date-based query (last 24 days excluding today)
- All volume amounts are returned as strings with 2 decimal places (e.g., `"125000.50"`)
- Division by zero in average calculations returns `"0.00"`
