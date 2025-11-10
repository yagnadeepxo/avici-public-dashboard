import { useQuery } from '@tanstack/react-query'

interface HistogramDataPoint {
  hour: number
  spend: number
}

export function useHistogramData() {
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