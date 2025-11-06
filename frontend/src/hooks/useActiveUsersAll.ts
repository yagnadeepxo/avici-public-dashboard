import { useEffect, useState } from "react"

interface GraphPoint {
  timestamp: string
  activeUsers: number
}

interface UserStatsResponse {
  totalUsers: number
  activeUsers24h: number
  totalCards: number
  activeCards24h: number
  timestamp: string
  graphData: GraphPoint[]
}

export const useActiveUserAll = (
  timeFrame = "24h",
  timeStart = "2025-01-01T00:00:00Z",
  timeEnd = "2025-11-06T00:00:00Z"
) => {
  const [data, setData] = useState<UserStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `https://avici-cron-production.up.railway.app/api/users/stats?timeFrame=${timeFrame}&timeStart=${timeStart}&timeEnd=${timeEnd}`
        )
        if (!res.ok) throw new Error("Failed to fetch active user stats")
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
