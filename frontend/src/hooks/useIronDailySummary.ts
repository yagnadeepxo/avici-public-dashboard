"use client"

import { useQuery } from "@tanstack/react-query"

export interface DailySummary {
  date: string
  summary: {
    total_transactions: number
    total_onramps: number
    total_offramps: number
    onramp_volume_usd: string
    offramp_volume_usd: string
    average_onramp_usd: string
    average_offramp_usd: string
  }
}

export interface IronDailySummaryResponse {
  success: boolean
  daily_summaries: DailySummary[]
  filters_applied: {
    customer_id: string | null
    start_date: string | null
    end_date: string | null
    status: string
  }
  generated_at: string
}

export function useIronDailySummary(startDate?: string, endDate?: string) {
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

  // Get cached data from sessionStorage to use as placeholder
  const cacheKey = `ironDailySummary:${startDate || "all"}:${endDate || "all"}`
  const cachedData = getCache<IronDailySummaryResponse>(cacheKey)

  const { data, isLoading, isFetching, error } = useQuery<IronDailySummaryResponse>({
    queryKey: ["ironDailySummary", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const cached = getCache<IronDailySummaryResponse>(cacheKey)
      if (cached) {
        return cached
      }

      const url = `/api/virtual-accounts/daily-summary${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch iron daily summary")
      const json = (await res.json()) as IronDailySummaryResponse
      setCache(cacheKey, json)
      return json
    },
    placeholderData: cachedData || undefined,
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
    error: error ? (error as Error).message : null,
  }
}






