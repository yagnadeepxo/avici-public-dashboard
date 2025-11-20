import { useQuery } from '@tanstack/react-query'

interface HistogramDataPoint {
  hour: number
  spend: number
  index: number
  timestamp: string
}

export function useHistogramData() {
  const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  const getCache = <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(key)
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
      window.localStorage.setItem(
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
      // Rolling 24-hour window: fetch from yesterday to tomorrow to ensure we have latest 24 hours
      const now = new Date()
      // Start from 25 hours ago (yesterday minus 1 hour to ensure we have enough data)
      const start = new Date(now.getTime() - 25 * 60 * 60 * 1000)
      // End at tomorrow to ensure we have the latest data
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
      const end = tomorrow

      const timeStart = start.toISOString()
      const timeEnd = end.toISOString()

      const cacheKey = `histogramData:${timeStart}:${timeEnd}`
      const cached = getCache<HistogramDataPoint[]>(cacheKey)
      if (cached) {
        return cached
      }

      const response = await fetch(
        `https://avici-cron-production.up.railway.app/api/users/stats?timeFrame=1h&timeStart=${encodeURIComponent(
          timeStart
        )}&timeEnd=${encodeURIComponent(timeEnd)}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch hourly stats')
      }

      const raw = await response.json()
      const graphData: Array<{
        timestamp: string
        periodStart: string
        totalSpend: number
      }> = raw?.graphData || []

      // Sort by periodStart to ensure chronological order (oldest first)
      const sortedData = [...graphData].sort((a, b) => {
        const dateA = new Date(a.periodStart || a.timestamp).getTime()
        const dateB = new Date(b.periodStart || b.timestamp).getTime()
        return dateA - dateB
      })

      // Take only the latest 24 data points (rolling 24-hour window)
      const latest24 = sortedData.slice(-24)

      // Map to HistogramDataPoint format with actual UTC hour, spend in USD, index, and timestamp
      const hourly = latest24.map((pt, idx) => {
        const periodStart = pt.periodStart || pt.timestamp
        const hour = new Date(periodStart).getUTCHours()
        const spendUsd = (pt.totalSpend || 0) / 100
        return { 
          hour, 
          spend: spendUsd,
          index: idx, // 0-23 for X-axis ordering
          timestamp: periodStart
        }
      })

      setCache(cacheKey, hourly)
      return hourly
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