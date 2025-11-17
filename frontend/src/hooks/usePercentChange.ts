import { useState, useEffect } from "react"

interface PercentageChanges {
  totalSpends: number
  totalTransactions: number
  totalCreditCreated: number
  averageSpend: number
  activeCards: number
  uniqueUsers: number
}

interface PercentChangeResponse {
  changes: PercentageChanges | null
  loading: boolean
  error: string | null
}

export function usePercentChange(daysBack: number = 1): PercentChangeResponse {
  const [changes, setChanges] = useState<PercentageChanges | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPercentChanges = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get today's date and comparison date in YYYY-MM-DD format
        const today = new Date()
        const comparisonDate = new Date(today)
        comparisonDate.setDate(comparisonDate.getDate() - daysBack)

        const todayStr = today.toISOString().split("T")[0]
        const comparisonStr = comparisonDate.toISOString().split("T")[0]

        // Fetch both dates
        const [todayResponse, comparisonResponse] = await Promise.all([
          fetch(
            `https://avici-public-dashboard-production.up.railway.app/api/stats?date=${todayStr}`
          ),
          fetch(
            `https://avici-public-dashboard-production.up.railway.app/api/stats?date=${comparisonStr}`
          ),
        ])

        if (!todayResponse.ok || !comparisonResponse.ok) {
          throw new Error("Failed to fetch stats")
        }

        const todayData = await todayResponse.json()
        const comparisonData = await comparisonResponse.json()

        // Handle if data is in array format
        const todayStats = Array.isArray(todayData) ? todayData[0] : todayData
        const comparisonStats = Array.isArray(comparisonData)
          ? comparisonData[0]
          : comparisonData

        if (!todayStats || !comparisonStats) {
          setChanges(null)
          return
        }

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        const percentageChanges: PercentageChanges = {
          totalSpends: calculateChange(
            todayStats.total_spends,
            comparisonStats.total_spends
          ),
          totalTransactions: calculateChange(
            todayStats.total_transactions,
            comparisonStats.total_transactions
          ),
          totalCreditCreated: calculateChange(
            todayStats.total_credit_created,
            comparisonStats.total_credit_created
          ),
          averageSpend: calculateChange(
            todayStats.average_spend,
            comparisonStats.average_spend
          ),
          activeCards: calculateChange(
            todayStats.active_cards,
            comparisonStats.active_cards
          ),
          uniqueUsers: calculateChange(
            todayStats.unique_users,
            comparisonStats.unique_users
          ),
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
  }, [daysBack])

  return { changes, loading, error }
}