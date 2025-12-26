import { useState, useEffect } from "react"

interface PercentageChanges {
  totalSpends: number
  totalTransactions: number
  totalSpendTransactions: number
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

        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)

        if (daysBack === 1) {
          // For 24h: Compare yesterday vs day before yesterday
          const comparisonDate = new Date(yesterday)
          comparisonDate.setUTCDate(comparisonDate.getUTCDate() - 1)

          const timeStart = comparisonDate.toISOString()
          const timeEnd = today.toISOString()

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

          const formatDateForComparison = (date: Date): string => {
            const year = date.getUTCFullYear()
            const month = String(date.getUTCMonth() + 1).padStart(2, "0")
            const day = String(date.getUTCDate()).padStart(2, "0")
            return `${year}-${month}-${day}`
          }

          const yesterdayStr = formatDateForComparison(yesterday)
          const comparisonStr = formatDateForComparison(comparisonDate)

          const sortedGraphData = [...data.graphData].sort((a, b) => 
            a.timestamp.localeCompare(b.timestamp)
          )

          const yesterdayData = sortedGraphData.find((point) => {
            const pointDate = point.timestamp.split(" ")[0]
            return pointDate === yesterdayStr
          })

          const comparisonData = sortedGraphData.find((point) => {
            const pointDate = point.timestamp.split(" ")[0]
            return pointDate === comparisonStr
          })

          if (!yesterdayData || !comparisonData) {
            setChanges(null)
            return
          }

          const calculateChange = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
          }

          const yesterdayTotalSpend = parseFloat(yesterdayData.totalSpend)
          const comparisonTotalSpend = parseFloat(comparisonData.totalSpend)
          const yesterdayTotalCredit = parseFloat(yesterdayData.totalCredit)
          const comparisonTotalCredit = parseFloat(comparisonData.totalCredit)

          const yesterdayAvgSpend =
            yesterdayData.spendCount > 0
              ? yesterdayTotalSpend / yesterdayData.spendCount
              : 0
          const comparisonAvgSpend =
            comparisonData.spendCount > 0
              ? comparisonTotalSpend / comparisonData.spendCount
              : 0

          const percentageChanges: PercentageChanges = {
            totalSpends: calculateChange(yesterdayTotalSpend, comparisonTotalSpend),
            totalTransactions: calculateChange(
              yesterdayData.totalTransactions,
              comparisonData.totalTransactions
            ),
            totalCreditCreated: calculateChange(yesterdayTotalCredit, comparisonTotalCredit),
            totalSpendTransactions: calculateChange(
              yesterdayData.spendCount,
              comparisonData.spendCount
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
        } else {
          // For 7d and 30d: Sum current period and previous period
          // Current period: yesterday minus daysBack to yesterday
          // Previous period: (yesterday - daysBack) minus daysBack to (yesterday - daysBack)
          
          const currentPeriodEnd = yesterday
          const currentPeriodStart = new Date(yesterday)
          currentPeriodStart.setUTCDate(currentPeriodStart.getUTCDate() - daysBack)
          
          const previousPeriodEnd = new Date(currentPeriodStart)
          previousPeriodEnd.setUTCDate(previousPeriodEnd.getUTCDate() - 1)
          const previousPeriodStart = new Date(previousPeriodEnd)
          previousPeriodStart.setUTCDate(previousPeriodStart.getUTCDate() - daysBack)

          // Fetch data covering both periods
          const timeStart = previousPeriodStart.toISOString()
          const timeEnd = today.toISOString()

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

          const sortedGraphData = [...data.graphData].sort((a, b) => 
            a.timestamp.localeCompare(b.timestamp)
          )

          // Helper to get date string from Date object
          const formatDate = (date: Date): string => {
            const year = date.getUTCFullYear()
            const month = String(date.getUTCMonth() + 1).padStart(2, "0")
            const day = String(date.getUTCDate()).padStart(2, "0")
            return `${year}-${month}-${day}`
          }

          // Filter data points for current period (exclusive start, inclusive end)
          const currentPeriodData = sortedGraphData.filter((point) => {
            const pointDate = point.timestamp.split(" ")[0]
            const pointTime = new Date(point.timestamp)
            return pointTime > currentPeriodStart && pointTime <= currentPeriodEnd
          })

          // Filter data points for previous period (exclusive start, inclusive end)
          const previousPeriodData = sortedGraphData.filter((point) => {
            const pointDate = point.timestamp.split(" ")[0]
            const pointTime = new Date(point.timestamp)
            return pointTime > previousPeriodStart && pointTime <= previousPeriodEnd
          })

          if (currentPeriodData.length === 0 || previousPeriodData.length === 0) {
            setChanges(null)
            return
          }

          // Sum up metrics for current period
          const currentSums = currentPeriodData.reduce(
            (acc, point) => ({
              totalSpend: acc.totalSpend + parseFloat(point.totalSpend),
              totalTransactions: acc.totalTransactions + point.totalTransactions,
              spendCount: acc.spendCount + point.spendCount,
              totalCredit: acc.totalCredit + parseFloat(point.totalCredit),
              activeCards: acc.activeCards + point.activeCards,
              activeUsers: acc.activeUsers + point.activeUsers,
            }),
            {
              totalSpend: 0,
              totalTransactions: 0,
              spendCount: 0,
              totalCredit: 0,
              activeCards: 0,
              activeUsers: 0,
            }
          )

          // Sum up metrics for previous period
          const previousSums = previousPeriodData.reduce(
            (acc, point) => ({
              totalSpend: acc.totalSpend + parseFloat(point.totalSpend),
              totalTransactions: acc.totalTransactions + point.totalTransactions,
              spendCount: acc.spendCount + point.spendCount,
              totalCredit: acc.totalCredit + parseFloat(point.totalCredit),
              activeCards: acc.activeCards + point.activeCards,
              activeUsers: acc.activeUsers + point.activeUsers,
            }),
            {
              totalSpend: 0,
              totalTransactions: 0,
              spendCount: 0,
              totalCredit: 0,
              activeCards: 0,
              activeUsers: 0,
            }
          )

          // Calculate average values for the periods
          const currentAvgActiveCards = currentSums.activeCards / currentPeriodData.length
          const previousAvgActiveCards = previousSums.activeCards / previousPeriodData.length
          const currentAvgActiveUsers = currentSums.activeUsers / currentPeriodData.length
          const previousAvgActiveUsers = previousSums.activeUsers / previousPeriodData.length

          // Calculate average spend per transaction
          const currentAvgSpend =
            currentSums.spendCount > 0
              ? currentSums.totalSpend / currentSums.spendCount
              : 0
          const previousAvgSpend =
            previousSums.spendCount > 0
              ? previousSums.totalSpend / previousSums.spendCount
              : 0

          const calculateChange = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
          }

          const percentageChanges: PercentageChanges = {
            totalSpends: calculateChange(currentSums.totalSpend, previousSums.totalSpend),
            totalTransactions: calculateChange(
              currentSums.totalTransactions,
              previousSums.totalTransactions
            ),
            totalCreditCreated: calculateChange(
              currentSums.totalCredit,
              previousSums.totalCredit
            ),
            totalSpendTransactions: calculateChange(
              currentSums.spendCount,
              previousSums.spendCount
            ),
            averageSpend: calculateChange(currentAvgSpend, previousAvgSpend),
            activeCards: calculateChange(currentAvgActiveCards, previousAvgActiveCards),
            uniqueUsers: calculateChange(currentAvgActiveUsers, previousAvgActiveUsers),
          }

          setChanges(percentageChanges)
          setCache(cacheKey, percentageChanges)
        }
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