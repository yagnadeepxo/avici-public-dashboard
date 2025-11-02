import { useState, useEffect } from 'react'

interface HistogramDataPoint {
  hour: number
  spend: number
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
        const hourlySpends = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          spend: 0
        }))

        // Fill in the pre-calculated hourly differences from the database
        // Divide by 100 because amounts are stored with 2 decimal points (e.g., 1000 = $10.00)
        todayData.forEach((item: any) => {
          if (item.hour !== undefined && item.hourly_spend_difference !== undefined) {
            hourlySpends[item.hour] = {
              hour: item.hour,
              spend: item.hourly_spend_difference / 100
            }
          }
        })

        setData(hourlySpends)
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