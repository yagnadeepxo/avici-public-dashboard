import { useState, useEffect } from 'react'

interface HistogramDataPoint {
  hour: number
  count: number
}

export function useHistogramData() {
  const [data, setData] = useState<HistogramDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistogramData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('https://avici-public-dashboard-production.up.railway.app/api/stats?period=24H')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }

        const rawData = await response.json()
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0]
        
        // Filter only today's data
        const todayData = rawData.filter((item: any) => {
          if (!item.date) return false
          return item.date === today
        })

        // Create array for all 24 hours initialized with 0
        const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: 0
        }))


        todayData.forEach((item: any) => {
          if (item.hour !== undefined && item.hourly_transaction_difference !== undefined) {
            hourlyCounts[item.hour] = {
              hour: item.hour,
              count: item.hourly_transaction_difference 
            }
          }
        })

        setData(hourlyCounts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchHistogramData()
  }, [])

  return { data, loading, error }
}