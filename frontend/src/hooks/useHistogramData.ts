import { useQuery } from '@tanstack/react-query'

interface HistogramDataPoint {
  hour: number
  spend: number
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
      // Compute today's 00:00:00Z and tomorrow's 00:00:00Z in UTC
      const now = new Date()
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 1)

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

      // Base 0-23 array, defaulting to 0
      const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, spend: 0 }))

      // Fill from API -> use periodStart hour; convert cents to dollars
      graphData.forEach((pt) => {
        const hour = new Date(pt.periodStart || pt.timestamp).getUTCHours()
        const spendUsd = (pt.totalSpend || 0) / 100
        if (hour >= 0 && hour <= 23) {
          hourly[hour] = { hour, spend: spendUsd }
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