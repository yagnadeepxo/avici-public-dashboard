import { useState, useEffect } from "react"

interface PercentageChanges {
  totalSpends: number
  totalTransactions: number
  totalCreditCreated: number
  totalSpendTransactions: number
  averageSpend: number
  activeCards: number
  uniqueUsers: number
}

interface PercentChangeResponse {
  changes: PercentageChanges | null
  loading: boolean
  error: string | null
}

interface DailyAlltimeStatsData {
  snapshot_date: string
  timeframe: string
  total_spends: number
  total_credit_created: number
  total_transactions: number
  average_spend: number
  active_cards: number
  unique_users: number
  spend_transaction_count: number
  credit_transaction_count: number
  created_at: string
}

interface DailyAlltimeStatsResponse {
  success: boolean
  data: DailyAlltimeStatsData
}

export function useAlltimePercentChange(): PercentChangeResponse {
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
    const cacheKey = "alltimePercentChanges"
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

        // Calculate dates in UTC
        // We need yesterday and day before yesterday
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        
        const dayBeforeYesterday = new Date(yesterday)
        dayBeforeYesterday.setUTCDate(dayBeforeYesterday.getUTCDate() - 1)

        // Format dates as YYYY-MM-DD
        const formatDate = (date: Date): string => {
          const year = date.getUTCFullYear()
          const month = String(date.getUTCMonth() + 1).padStart(2, "0")
          const day = String(date.getUTCDate()).padStart(2, "0")
          return `${year}-${month}-${day}`
        }

        const yesterdayStr = formatDate(yesterday)
        const dayBeforeYesterdayStr = formatDate(dayBeforeYesterday)

        // Fetch both dates from the frontend API wrapper
        const [yesterdayResponse, dayBeforeYesterdayResponse] = await Promise.all([
          fetch(`/api/dashboard/daily-alltime-stats?date=${yesterdayStr}`),
          fetch(`/api/dashboard/daily-alltime-stats?date=${dayBeforeYesterdayStr}`)
        ])

        if (!yesterdayResponse.ok || !dayBeforeYesterdayResponse.ok) {
          // If either request fails, check if it's a 404 (no data yet)
          if (yesterdayResponse.status === 404 || dayBeforeYesterdayResponse.status === 404) {
            setChanges(null)
            setLoading(false)
            return
          }
          throw new Error("Failed to fetch stats")
        }

        const yesterdayData: DailyAlltimeStatsResponse = await yesterdayResponse.json()
        const dayBeforeYesterdayData: DailyAlltimeStatsResponse = await dayBeforeYesterdayResponse.json()

        if (!yesterdayData.success || !yesterdayData.data || 
            !dayBeforeYesterdayData.success || !dayBeforeYesterdayData.data) {
          setChanges(null)
          return
        }

        const yesterdayStats = yesterdayData.data
        const dayBeforeYesterdayStats = dayBeforeYesterdayData.data

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        const percentageChanges: PercentageChanges = {
          totalSpends: calculateChange(
            yesterdayStats.total_spends,
            dayBeforeYesterdayStats.total_spends
          ),
          totalTransactions: calculateChange(
            yesterdayStats.total_transactions,
            dayBeforeYesterdayStats.total_transactions
          ),
          totalSpendTransactions: calculateChange(
            yesterdayStats.spend_transaction_count,
            dayBeforeYesterdayStats.spend_transaction_count
          ),
          totalCreditCreated: calculateChange(
            yesterdayStats.total_credit_created,
            dayBeforeYesterdayStats.total_credit_created
          ),
          averageSpend: calculateChange(
            yesterdayStats.average_spend,
            dayBeforeYesterdayStats.average_spend
          ),
          activeCards: calculateChange(
            yesterdayStats.active_cards,
            dayBeforeYesterdayStats.active_cards
          ),
          uniqueUsers: calculateChange(
            yesterdayStats.unique_users,
            dayBeforeYesterdayStats.unique_users
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
  }, [])

  return { changes, loading, error }
}


