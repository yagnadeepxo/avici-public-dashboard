import { useState, useEffect } from "react"

interface PercentageChanges {
  totalSpends: number
  totalTransactions: number
  totalCreditCreated: number
  averageSpend: number
  activeCards: number
  uniqueUsers: number
}

interface PercentChangeResponse {
  changes: PercentageChanges | null
  loading: boolean
  error: string | null
}

interface GraphDataPoint {
  timestamp: string
  periodStart: string
  periodEnd: string
  activeUsers: number
  activeCards: number
  totalTransactions: number
  totalSpend: string
  spendCount: number
  totalCredit: string
  creditCount: number
}

interface StatsResponse {
  totalUsers: number
  activeUsers24h: number
  totalCards: number
  activeCards24h: number
  timestamp: string
  graphData: GraphDataPoint[]
  timeFrame: string
  timeStart: string
  timeEnd: string
}

export function usePercentChange(daysBack: number = 1): PercentChangeResponse {
  const [changes, setChanges] = useState<PercentageChanges | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  const getCache = <T,>(key: string): T | null => {
    if (typeof window === "undefined") return null
    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { data: T; fetchedAt: number }
      if (!parsed?.data || !parsed?.fetchedAt) return null
      if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null
      return parsed.data
    } catch {
      return null
    }
  }

  const setCache = (key: string, data: unknown) => {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          data,
          fetchedAt: Date.now(),
        })
      )
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    const cacheKey = `percentChanges:${daysBack}`
    const cached = getCache<PercentageChanges>(cacheKey)
    if (cached) {
      setChanges(cached)
      setLoading(false)
      setError(null)
      return
    }

    const fetchPercentChanges = async () => {
      try {
        setLoading(true)
        setError(null)

        // Calculate dates in UTC to match API format:
        // - For 24h/all (daysBack=1): Compare yesterday vs day before yesterday
        // - For 7d (daysBack=7): Compare yesterday vs 7 days before yesterday
        // - For 30d (daysBack=30): Compare yesterday vs 30 days before yesterday
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        
        // Calculate comparison date from yesterday, not from today
        const comparisonDate = new Date(yesterday)
        comparisonDate.setUTCDate(comparisonDate.getUTCDate() - daysBack)

        // We need to fetch data from comparisonDate to today (to include full day of yesterday)
        // timeStart should be the start of comparisonDate
        // timeEnd should be the start of today (which includes all of yesterday)
        const timeStart = comparisonDate.toISOString()
        const timeEnd = today.toISOString()

        // Fetch data from the new API wrapper
        const params = new URLSearchParams({
          timeFrame: "24h",
          timeStart,
          timeEnd,
        })
        const response = await fetch(
          `/api/dashboard/users-stats?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }

        const data: StatsResponse = await response.json()

        if (!data.graphData || data.graphData.length === 0) {
          setChanges(null)
          return
        }

        // Find yesterday's data and comparison date's data
        // The timestamp in graphData represents the start of that day's period
        // Format: "2025-11-18 00:00:00+00" means data for Nov 18
        const formatDateForComparison = (date: Date): string => {
          // Use UTC date to match API format
          const year = date.getUTCFullYear()
          const month = String(date.getUTCMonth() + 1).padStart(2, "0")
          const day = String(date.getUTCDate()).padStart(2, "0")
          return `${year}-${month}-${day}`
        }

        const yesterdayStr = formatDateForComparison(yesterday)
        const comparisonStr = formatDateForComparison(comparisonDate)

        // Sort graphData by timestamp to ensure correct order
        const sortedGraphData = [...data.graphData].sort((a, b) => 
          a.timestamp.localeCompare(b.timestamp)
        )

        // Find the data points for yesterday and comparison date
        // The timestamp format is "YYYY-MM-DD HH:mm:ss+TZ"
        const yesterdayData = sortedGraphData.find((point) => {
          const pointDate = point.timestamp.split(" ")[0] // Extract date part "YYYY-MM-DD"
          return pointDate === yesterdayStr
        })

        const comparisonData = sortedGraphData.find((point) => {
          const pointDate = point.timestamp.split(" ")[0] // Extract date part "YYYY-MM-DD"
          return pointDate === comparisonStr
        })

        if (!yesterdayData || !comparisonData) {
          setChanges(null)
          return
        }

        // Validate we're comparing the right dates (yesterday should be after comparison date)
        const yesterdayTimestamp = new Date(yesterdayData.timestamp)
        const comparisonTimestamp = new Date(comparisonData.timestamp)
        if (yesterdayTimestamp <= comparisonTimestamp) {
          // Dates are in wrong order, something is wrong
          setChanges(null)
          return
        }

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        // Parse string values to numbers
        const yesterdayTotalSpend = parseFloat(yesterdayData.totalSpend)
        const comparisonTotalSpend = parseFloat(comparisonData.totalSpend)
        const yesterdayTotalCredit = parseFloat(yesterdayData.totalCredit)
        const comparisonTotalCredit = parseFloat(comparisonData.totalCredit)

        // Calculate average spend
        const yesterdayAvgSpend =
          yesterdayData.spendCount > 0
            ? yesterdayTotalSpend / yesterdayData.spendCount
            : 0
        const comparisonAvgSpend =
          comparisonData.spendCount > 0
            ? comparisonTotalSpend / comparisonData.spendCount
            : 0

        const percentageChanges: PercentageChanges = {
          totalSpends: calculateChange(
            yesterdayTotalSpend,
            comparisonTotalSpend
          ),
          totalTransactions: calculateChange(
            yesterdayData.totalTransactions,
            comparisonData.totalTransactions
          ),
          totalCreditCreated: calculateChange(
            yesterdayTotalCredit,
            comparisonTotalCredit
          ),
          averageSpend: calculateChange(yesterdayAvgSpend, comparisonAvgSpend),
          activeCards: calculateChange(
            yesterdayData.activeCards,
            comparisonData.activeCards
          ),
          uniqueUsers: calculateChange(
            yesterdayData.activeUsers,
            comparisonData.activeUsers
          ),
        }

        setChanges(percentageChanges)
        setCache(cacheKey, percentageChanges)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setChanges(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPercentChanges()
  }, [daysBack])

  return { changes, loading, error }
}