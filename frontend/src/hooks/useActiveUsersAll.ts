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

export const useActiveUserAll = (
  timeFrame = "24h",
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd?: string
) => {
  const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  const getCache = <T,>(key: string): T | null => {
    if (typeof window === "undefined") return null
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
    if (typeof window === "undefined") return
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

  // Compute timeEnd inside queryFn to ensure it's fresh, but use stable key
  const { data, isLoading, error } = useQuery<UserStatsResponse>({
    queryKey: ["activeUsersAll", timeFrame, timeStart, timeEnd || "default"],
    queryFn: async () => {
      // Use provided timeEnd or current date
      const endDate = timeEnd || new Date().toISOString()
      const cacheKey = `activeUsersAll:${timeFrame}:${timeStart}:${endDate}`
      const cached = getCache<UserStatsResponse>(cacheKey)
      if (cached) {
        return cached
      }
      const apiUrl = process.env.NEXT_PUBLIC_AVICI_CRON_API_URL || 'https://avici-cron-production.up.railway.app'
      const res = await fetch(
        `${apiUrl}/api/users/stats?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${endDate}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch active user stats")
      }
      const json = await res.json()
      setCache(cacheKey, json)
      return json
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
