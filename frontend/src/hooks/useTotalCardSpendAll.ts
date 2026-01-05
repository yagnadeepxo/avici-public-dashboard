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
      // Use provided timeEnd or yesterday at end of day (23:59:59.999 UTC)
      let endDate = timeEnd
      if (!endDate) {
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        yesterday.setUTCHours(23, 59, 59, 999)
        endDate = yesterday.toISOString()
      }
      
      // Normalize timeStart to start of day (00:00:00.000 UTC) for consistency
      const startDate = new Date(timeStart)
      const normalizedTimeStart = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0, 0, 0, 0
      )).toISOString()
      const cacheKey = `totalCardSpendAll:${timeFrame}:${normalizedTimeStart}:${endDate}`
      const cached = getCache<UserStatsResponse>(cacheKey)
      if (cached) {
        return cached
      }
      const params = new URLSearchParams({
        timeFrame,
        timeStart: normalizedTimeStart,
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
    refetchInterval: 6 * 60 * 1000,
    retry: 1,
  })

  return {
    data: data || null,
    loading: isLoading && !data, // Only show loading if we don't have cached data
    error: error ? (error as Error).message : null,
  }
}