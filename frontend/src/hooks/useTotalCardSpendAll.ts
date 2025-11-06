import { useEffect, useState } from "react"

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

export const useTotalCardSpendAll = (
  timeFrame = "24h",
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd?: string
) => {
  const [data, setData] = useState<UserStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use today's date if timeEnd is not provided
        const endDate = timeEnd || new Date().toISOString()
        
        const res = await fetch(
          `https://avici-cron-production.up.railway.app/api/users/stats?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${endDate}`
        )
        if (!res.ok) throw new Error("Failed to fetch user stats")
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