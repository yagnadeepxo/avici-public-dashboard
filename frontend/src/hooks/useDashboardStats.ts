"use client"

import { useQuery } from "@tanstack/react-query"

export interface Stats {
  timeframe?: string
  totalSpends: string | number
  totalCreditCreated: string | number
  totalTransactions: number
  averageSpend: string | number
  activeCards: number
  uniqueUsers: number
  spendTransactionCount: number
  creditTransactionCount: number
}

export function useStats(timeframe: string) {
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

  const normalizedTimeframe = timeframe?.toLowerCase() || ""
  const queryTimeframe = normalizedTimeframe === "all" ? "" : normalizedTimeframe

  // Get cached data from sessionStorage to use as placeholder
  const cacheKey = `dashboardStats:${queryTimeframe || "all"}`
  const cachedData = getCache<Stats>(cacheKey)

  const { data, isLoading, isFetching, error } = useQuery<Stats>({
    queryKey: ["dashboardStats", queryTimeframe],
    queryFn: async () => {
      const params = queryTimeframe === "" ? "" : `?timeframe=${queryTimeframe}`

      const cached = getCache<Stats>(cacheKey)
      if (cached) {
        return cached
      }

      const res = await fetch(`/api/dashboard/total-stats${params}`)
      if (!res.ok) throw new Error("Failed to fetch stats")
      const json = (await res.json()) as Stats
      setCache(cacheKey, json)
      return json
    },
    placeholderData: (previousData) => previousData || cachedData || undefined,
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 6 * 60 * 1000,
    retry: 1,
  })

  return {
    data: data || null,
    loading: isFetching && !!data, // Only show loading when we have data and are fetching (silent on initial load)
    isFetching, // Expose isFetching for loading indicator
    error: error ? (error as Error).message : null,
  }
}
