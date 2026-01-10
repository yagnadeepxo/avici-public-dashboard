"use client"

import { useQuery } from "@tanstack/react-query"

export interface GraphPoint {
  timestamp: string
  totalVolume: number
  onrampVolume: number
  offrampVolume: number
  isOngoing?: boolean
}

export interface IronVolumeDynamicResponse {
  period: "7d" | "30d"
  summary: {
    total_transactions: number
    total_onramps: number
    total_offramps: number
    onramp_volume_usd: string
    offramp_volume_usd: string
    average_onramp_usd: string
    average_offramp_usd: string
  }
  graphData: GraphPoint[]
  date_range: {
    start_date: string
    end_date: string
  }
  timestamp: string
}

export function useIronVolumeDynamic(
  period: "7d" | "30d" = "7d"
) {
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
  const cacheKey = `ironVolumeDynamic:${period}`
  const cachedData = getCache<IronVolumeDynamicResponse>(cacheKey)

  const { data, isLoading, error } = useQuery<IronVolumeDynamicResponse>({
    queryKey: ["ironVolumeDynamic", period],
    queryFn: async () => {
      const cached = getCache<IronVolumeDynamicResponse>(cacheKey)
      if (cached) {
        return cached
      }

      const params = new URLSearchParams({
        period,
      })

      const res = await fetch(`/api/virtual-accounts/period-summary?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch iron period summary")

      const json = (await res.json()) as {
        success: boolean
        period: "7d" | "30d"
        summary: IronVolumeDynamicResponse["summary"]
        daily_data: Array<{
          date: string
          onramp_volume_usd: string
          offramp_volume_usd: string
          is_ongoing: boolean
        }>
        date_range: IronVolumeDynamicResponse["date_range"]
        generated_at: string
      }

      // Transform daily_data to graphData format
      const graphData: GraphPoint[] = json.daily_data.map((day) => {
        const onrampVol = parseFloat(day.onramp_volume_usd)
        const offrampVol = parseFloat(day.offramp_volume_usd)
        const totalVol = onrampVol + offrampVol

        return {
          timestamp: day.date,
          totalVolume: totalVol,
          onrampVolume: onrampVol,
          offrampVolume: offrampVol,
          isOngoing: day.is_ongoing,
        }
      })

      const response: IronVolumeDynamicResponse = {
        period: json.period,
        summary: json.summary,
        graphData,
        date_range: json.date_range,
        timestamp: json.generated_at,
      }

      setCache(cacheKey, response)
      return response
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
    loading: isLoading && !data,
    error: error ? (error as Error).message : null,
  }
}

