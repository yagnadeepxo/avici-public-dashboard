import { useQuery } from '@tanstack/react-query'

interface HistogramDataPoint {
  day: string
  spend: number
  index: number
  timestamp: string
}

export function useHistogramData() {
  const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  const getCache = <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null
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
    if (typeof window === 'undefined') return
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

  const { data, isLoading, error } = useQuery<HistogramDataPoint[]>({
    queryKey: ['histogramData'],
    queryFn: async () => {
      // Fetch last 24 days of daily data
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      
      // End date: yesterday at end of day (23:59:59.999 UTC)
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      yesterday.setUTCHours(23, 59, 59, 999)
      const timeEnd = yesterday.toISOString()
      
      // Start date: 24 days before yesterday (to get 24 complete days)
      const startDate = new Date(yesterday)
      startDate.setUTCDate(startDate.getUTCDate() - 23) // 24 days total (including yesterday)
      startDate.setUTCHours(0, 0, 0, 0)
      const timeStart = startDate.toISOString()

      const cacheKey = `histogramData:${timeStart}:${timeEnd}`
      const cached = getCache<HistogramDataPoint[]>(cacheKey)
      if (cached) {
        return cached
      }

      const params = new URLSearchParams({
        timeFrame: "24h", // Daily data
        timeStart,
        timeEnd,
      })
      const response = await fetch(
        `/api/dashboard/users-stats?${params.toString()}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch daily stats')
      }

      const raw = await response.json()
      const graphData: Array<{
        timestamp: string
        totalSpend: number
      }> = raw?.graphData || []

      // Sort by timestamp to ensure chronological order (oldest first)
      const sortedData = [...graphData].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime()
        const dateB = new Date(b.timestamp).getTime()
        return dateA - dateB
      })

      // Take only the latest 24 data points (last 24 days)
      const latest24 = sortedData.slice(-24)

      // Map to HistogramDataPoint format with day label, spend in USD, index, and timestamp
      const daily = latest24.map((pt, idx) => {
        const date = new Date(pt.timestamp)
        const dayLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
        const spendUsd = (pt.totalSpend || 0) / 100
        return { 
          day: dayLabel, 
          spend: spendUsd,
          index: idx, // 0-23 for X-axis ordering
          timestamp: pt.timestamp
        }
      })

      setCache(cacheKey, daily)
      return daily
    },
    staleTime: 1800000, // 30 minutes cache - data is fresh for 30 minutes
    gcTime: 3600000, // 1 hour - keep in cache for 1 hour
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1,
  })

  return {
    data: data || [],
    loading: isLoading && !data, // Only show loading if we don't have cached data
    error: error ? (error as Error).message : null,
  }
}