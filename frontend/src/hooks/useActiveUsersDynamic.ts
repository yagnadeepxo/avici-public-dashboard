// useActiveUsersDynamic.ts
import { useQuery } from "@tanstack/react-query"

interface GraphPoint {
  timestamp: string
  activeUsers: number
}

interface UserStatsResponse {
  totalUsers: number
  activeUsers24h: number
  totalCards: number
  activeCards24h: number
  timestamp: string
  graphData: GraphPoint[]
}

export const useActiveUserDynamic = (
  timeFrame: string = "24h",
  daysBack: number = 30
) => {
  const { data, isLoading, error } = useQuery<UserStatsResponse>({
    queryKey: ["activeUsersDynamic", timeFrame, daysBack],
    queryFn: async () => {
      const timeEnd = new Date().toISOString()
      const timeStart = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
      
      const res = await fetch(
        `https://avici-cron-production.up.railway.app/api/users/stats?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${timeEnd}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch active user stats")
      }
      return res.json()
    },
    staleTime: 3600000, // 1 hour cache - data is fresh for 1 hour
    gcTime: 7200000, // 2 hours - keep in cache for 2 hours
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1,
  })

  return {
    data: data || null,
    loading: isLoading && !data, // Only show loading if we don't have cached data
    error: error ? (error as Error).message : null,
  }
}