// useTotalCardSpendDynamic.ts
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

export const useSpendVolumeDynamic = (
  timeFrame: string = "24h",
  daysBack: number = 30
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
    queryKey: ["spendVolumeDynamic", timeFrame, daysBack],
    queryFn: async () => {
      // Normalize dates to UTC day boundaries for consistency
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      
      let timeStart: string
      let timeEnd: string
      
      if (daysBack === 30) {
        // For 30d: Start from January 1st of current year, end at today (to include current month even if incomplete)
        const januaryFirst = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
        timeStart = januaryFirst.toISOString()
        timeEnd = today.toISOString() // Include today for current month
      } else if (daysBack === 7) {
        // For 7d: Fetch enough data and include up to today (to show incomplete periods)
        const startDate = new Date(today)
        startDate.setUTCDate(startDate.getUTCDate() - 180) // Fetch 180 days back
        timeStart = startDate.toISOString()
        timeEnd = today.toISOString() // Include today for incomplete periods
      } else {
        // For other timeframes: yesterday at end of day (23:59:59.999 UTC)
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        yesterday.setUTCHours(23, 59, 59, 999)
        timeEnd = yesterday.toISOString()
        
        const startDate = new Date(yesterday)
        const offsetDays = Math.max(daysBack - 1, 0)
        startDate.setUTCDate(startDate.getUTCDate() - offsetDays)
        startDate.setUTCHours(0, 0, 0, 0)
        timeStart = startDate.toISOString()
      }

      const cacheKey = `spendVolumeDynamic:${timeFrame}:${daysBack}`
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