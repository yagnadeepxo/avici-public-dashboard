"use client"

import { useQuery } from "@tanstack/react-query"

export interface IronPeriodSummary {
  total_transactions: number
  total_onramps: number
  total_offramps: number
  unique_users: number
  onramp_volume_usd: string
  offramp_volume_usd: string
  combined_volume_usd: string
  average_volume_usd: string
}

export interface DailyDataPoint {
  date: string
  total_transactions: number
  total_onramps: number
  total_offramps: number
  unique_users: number
  onramp_volume_usd: string
  offramp_volume_usd: string
  combined_volume_usd: string
  average_volume_usd: string
  is_ongoing: boolean
}

export interface IronPeriodSummaryResponse {
  success: boolean
  period: "24h" | "7d" | "30d"
  summary: IronPeriodSummary
  daily_data: DailyDataPoint[]
  date_range: {
    start_date: string
    end_date: string
    graph_start_date?: string
    graph_end_date?: string
  }
  filters_applied: {
    customer_id: string | null
    status: string
  }
  generated_at: string
}

export function useIronPeriodSummary(period: "24h" | "7d" | "30d" = "7d", enabled: boolean = true) {
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
  const cacheKey = `ironPeriodSummary:${period}`
  const cachedData = getCache<IronPeriodSummaryResponse>(cacheKey)

  const { data, isLoading, isFetching, error } = useQuery<IronPeriodSummaryResponse>({
    queryKey: ["ironPeriodSummary", period],
    queryFn: async () => {
      const cached = getCache<IronPeriodSummaryResponse>(cacheKey)
      if (cached) {
        return cached
      }

      const params = new URLSearchParams({
        period,
      })

      const res = await fetch(`/api/virtual-accounts/period-summary?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch iron period summary")
      const json = (await res.json()) as IronPeriodSummaryResponse
      setCache(cacheKey, json)
      return json
    },
    placeholderData: (previousData) => previousData || cachedData || undefined,
    enabled, // Only fetch when enabled
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

