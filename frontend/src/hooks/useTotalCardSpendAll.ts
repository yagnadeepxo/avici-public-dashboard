import { useQuery } from "@tanstack/react-query"

interface GraphPoint {
  timestamp: string
  totalSpend: number
}

interface UserStatsResponse {
  totalUsers: number
  activeUsers24h: number
  totalCards: number
  activeCards24h: number
  timestamp: string
  graphData: GraphPoint[]
}

export const useTotalCardSpendAll = (
  timeFrame = "24h",
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd?: string
) => {
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

  const { data, isLoading, error } = useQuery<UserStatsResponse>({
    queryKey: ["totalCardSpendAll", timeFrame, timeStart, timeEnd || "default"],
    queryFn: async () => {
      // Use provided timeEnd or current date
      const endDate = timeEnd || new Date().toISOString()
      const cacheKey = `totalCardSpendAll:${timeFrame}:${timeStart}:${timeEnd ? timeEnd : "auto"}`
      const cached = getCache<UserStatsResponse>(cacheKey)
      if (cached) {
        return cached
      }
      const params = new URLSearchParams({
        timeFrame,
        timeStart,
        timeEnd: endDate,
      })
      const res = await fetch(
        `/api/dashboard/users-stats?${params.toString()}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch user stats")
      }
      const json = await res.json()
      setCache(cacheKey, json)
      return json
    },
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS * 2,
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