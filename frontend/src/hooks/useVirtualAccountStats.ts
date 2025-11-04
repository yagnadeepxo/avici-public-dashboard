import { useState, useEffect } from "react"

type TimePeriod = "all" | "24h" | "7d" | "30d" | "90d"

interface VirtualAccountStats {
  totalVolume: number
  uniqueVirtualAccounts: number
  uniqueCustomers: number
  count: number
}

interface UseVirtualAccountStatsReturn {
  data: VirtualAccountStats | null
  loading: boolean
  error: string | null
}

export function useVirtualAccountStats(timePeriod: TimePeriod): UseVirtualAccountStatsReturn {
  const [data, setData] = useState<VirtualAccountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = `https://wallet-cron-production.up.railway.app/api/virtual-accounts/activities?timeframe=${timePeriod}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          setData({
            totalVolume: result.total_volume || 0,
            uniqueVirtualAccounts: result.unique_virtual_accounts || 0,
            uniqueCustomers: result.unique_customers || 0,
            count: result.count || 0,
          })
        } else {
          throw new Error("API returned unsuccessful response")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch virtual account stats")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timePeriod])

  return { data, loading, error }
}