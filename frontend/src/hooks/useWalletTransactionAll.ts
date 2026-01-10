import { useQuery } from "@tanstack/react-query"

interface GraphDataPoint {
  timestamp: string
  volume: number
  count: number
}

interface TransactionStatsResponse {
  success: boolean
  total_volume_usd: number
  total_count: number
  page: number
  limit: number
  has_more: boolean
  graph_data: GraphDataPoint[]
}

export const useWalletTransactionAll = (
  timeFrame = "24h",
  timeStart = "2025-03-01T00:00:00Z",
  timeEnd?: string
) => {
  const { data, isLoading, error } = useQuery<TransactionStatsResponse>({
    queryKey: ["walletTransactionAll", timeFrame, timeStart, timeEnd || "default"],
    queryFn: async () => {
      // Use provided timeEnd or current date
      const endDate = timeEnd || new Date().toISOString()
      const apiUrl = process.env.NEXT_PUBLIC_WALLET_CRON_API_URL || 'https://wallet-cron-production.up.railway.app'
      const res = await fetch(
        `${apiUrl}/api/stats/transactions?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${endDate}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch transaction stats")
      }
      return res.json()
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