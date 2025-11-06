import { useEffect, useState } from "react"

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
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd?: string
) => {
  const [data, setData] = useState<TransactionStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use today's date if timeEnd is not provided
        const endDate = timeEnd || new Date().toISOString()
        
        const res = await fetch(
          `https://wallet-cron-production.up.railway.app/api/stats/transactions?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${endDate}`
        )
        if (!res.ok) throw new Error("Failed to fetch transaction stats")
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