"use client"

import { useEffect, useState } from "react"

export interface Stats {
  totalSpends: number
  totalCreditCreated: number
  totalTransactions: number
  averageSpend: number
  activeCards: number
  uniqueUsers: number
  spendTransactionCount: number
  creditTransactionCount: number
}

export function useStats(timeframe: string) {
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const tf = timeframe.toUpperCase() === "ALL" ? "" : `?timeframe=${timeframe.toUpperCase()}`
        const res = await fetch(`https://avici-cron-production.up.railway.app/api/total-stats${tf}`)
        if (!res.ok) throw new Error("Failed to fetch stats")
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [timeframe])

  return { data, loading, error }
}
