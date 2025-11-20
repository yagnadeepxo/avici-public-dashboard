import { useQuery } from '@tanstack/react-query'

interface HistogramDataPoint {
  hour: number
  count: number
}

export function useHistogramData() {
  const { data, isLoading, error } = useQuery<HistogramDataPoint[]>({
    queryKey: ['transactionCountData'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_API_URL || 'https://avici-public-dashboard-production.up.railway.app'
      const response = await fetch(`${apiUrl}/api/stats?period=24H`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const rawData = await response.json()
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      
      // Filter only today's data
      const todayData = rawData.filter((item: any) => {
        if (!item.date) return false
        return item.date === today
      })

      // Create array for all 24 hours initialized with 0
      const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0
      }))

      todayData.forEach((item: any) => {
        if (item.hour !== undefined && item.hourly_transaction_difference !== undefined) {
          hourlyCounts[item.hour] = {
            hour: item.hour,
            count: item.hourly_transaction_difference 
          }
        }
      })

      return hourlyCounts
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