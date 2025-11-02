import { useState, useEffect } from 'react'

interface HistogramDataPoint {
  day: string
  transactions: number
}

interface ApiResponse {
  date: string
  total_transactions: number
}

export function useSpendCount7dData() {
  const [data, setData] = useState<HistogramDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistogramData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('https://avici-public-dashboard-production.up.railway.app/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }

        const apiData: ApiResponse[] = await response.json()
        
        // Transform the data for the histogram
        const histogramData: HistogramDataPoint[] = apiData.map(item => {
          const date = new Date(item.date)
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
          
          return {
            day: dayName,
            transactions: item.total_transactions
          }
        })

        setData(histogramData)
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