// useActiveUsersDynamic.ts
import { useQuery } from "@tanstack/react-query"

interface GraphPoint {
  timestamp: string
  activeCards: number
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

  const { data, isLoading, error } = useQuery<UserStatsResponse>({
    queryKey: ["activeUsersDynamic", timeFrame, daysBack],
    queryFn: async () => {
      let timeStart: string
      let timeEnd: string

      if (timeFrame === "1h") {
        // Rolling 24-hour window: fetch from yesterday to tomorrow to ensure we have latest 24 hours
        const now = new Date()
        // Start from 25 hours ago (yesterday minus 1 hour to ensure we have enough data)
        const start = new Date(now.getTime() - 25 * 60 * 60 * 1000)
        // End at tomorrow to ensure we have the latest data
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
        const end = tomorrow
        timeStart = start.toISOString()
        timeEnd = end.toISOString()
      } else {
        // Fallback for non-hourly cases: rolling window based on daysBack
        const end = new Date()
        const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000)
        timeStart = start.toISOString()
        timeEnd = end.toISOString()
      }

      const cacheKey = `activeUsersDynamic:${timeFrame}:${daysBack}`
      const cached = getCache<UserStatsResponse>(cacheKey)
      if (cached) {
        return cached
      }

      const params = new URLSearchParams({
        timeFrame,
        timeStart,
        timeEnd,
      })
      const res = await fetch(
        `/api/dashboard/users-stats?${params.toString()}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch active card stats")
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