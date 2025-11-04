import { useState, useEffect } from "react"

interface PercentageChanges {
  totalSpends: number
  totalTransactions: number
  averageSpend: number
  activeCards: number
  uniqueUsers: number
}

interface PercentChangeResponse {
  changes: PercentageChanges | null
  loading: boolean
  error: string | null
}

export function usePercentChange(): PercentChangeResponse {
  const [changes, setChanges] = useState<PercentageChanges | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPercentChanges = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get today's and yesterday's dates in YYYY-MM-DD format
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const todayStr = today.toISOString().split('T')[0]
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Fetch both dates
        const [todayResponse, yesterdayResponse] = await Promise.all([
          fetch(`https://avici-public-dashboard-production.up.railway.app/api/stats?date=${todayStr}`),
          fetch(`https://avici-public-dashboard-production.up.railway.app/api/stats?date=${yesterdayStr}`)
        ])

        if (!todayResponse.ok || !yesterdayResponse.ok) {
          throw new Error("Failed to fetch stats")
        }

        const todayData = await todayResponse.json()
        const yesterdayData = await yesterdayResponse.json()

        // Handle if data is in array format
        const todayStats = Array.isArray(todayData) ? todayData[0] : todayData
        const yesterdayStats = Array.isArray(yesterdayData) ? yesterdayData[0] : yesterdayData

        if (!todayStats || !yesterdayStats) {
          setChanges(null)
          return
        }

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        const percentageChanges: PercentageChanges = {
          totalSpends: calculateChange(todayStats.total_spends, yesterdayStats.total_spends),
          totalTransactions: calculateChange(todayStats.total_transactions, yesterdayStats.total_transactions),
          averageSpend: calculateChange(todayStats.average_spend, yesterdayStats.average_spend),
          activeCards: calculateChange(todayStats.active_cards, yesterdayStats.active_cards),
          uniqueUsers: calculateChange(todayStats.unique_users, yesterdayStats.unique_users),
        }

        setChanges(percentageChanges)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setChanges(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPercentChanges()
  }, [])

  return { changes, loading, error }
}