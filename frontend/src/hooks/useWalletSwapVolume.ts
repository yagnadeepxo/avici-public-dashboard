import { useEffect, useState } from "react"

interface GraphDataPoint {
  timestamp: string
  volume: number
  count: number
}

interface SwapStatsResponse {
  success: boolean
  total_volume_usd: number
  total_count: number
  page: number
  limit: number
  has_more: boolean
  graph_data: GraphDataPoint[]
}

export const useWalletSwapVolume = (
  timeFrame = "24h",
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd?: string
) => {
  const [data, setData] = useState<SwapStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use today's date if timeEnd is not provided
        const endDate = timeEnd || new Date().toISOString()
        
        const res = await fetch(
          `https://wallet-cron-production.up.railway.app/api/stats/swaps?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${endDate}`
        )
        if (!res.ok) throw new Error("Failed to fetch swap stats")
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeFrame, timeStart, timeEnd])

  return { data, loading, error }
}