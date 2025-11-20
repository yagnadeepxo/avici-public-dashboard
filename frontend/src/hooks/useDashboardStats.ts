"use client"

import { useQuery } from "@tanstack/react-query"

export interface Stats {
  totalSpends: number
  totalCreditCreated: number
  totalTransactions: number
  averageSpend: number
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

  const normalizedTimeframe = timeframe?.toUpperCase() || "ALL"

  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ["dashboardStats", normalizedTimeframe],
    queryFn: async () => {
      const params =
        normalizedTimeframe === "ALL" ? "" : `?timeframe=${normalizedTimeframe}`

      const cacheKey = `dashboardStats:${normalizedTimeframe}`
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
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return {
    data: data || null,
    loading: isLoading && !data,
    error: error ? (error as Error).message : null,
  }
}
