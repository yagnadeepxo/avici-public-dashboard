"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStats } from "@/hooks/useDashboardStats"

type TimePeriod = "all" | "24h" | "7d" | "30d"

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const { data, loading, error } = useStats(timePeriod)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Avici Public Dashboard</h1>
        </div>

        {/* Time Period Buttons */}
        <div className="flex gap-2 mb-6">
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <Button
              key={period}
              onClick={() => setTimePeriod(period)}
              variant={timePeriod === period ? "default" : "outline"}
              className="font-medium text-sm"
            >
              {period.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Stats Section */}
        <div className="space-y-4">
          {loading && <p className="text-muted-foreground text-sm">Loading stats...</p>}
          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
          {data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Spends</p>
                    <p className="text-xl font-bold">${data.totalSpends.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                    <p className="text-xl font-bold">{data.totalTransactions.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Average Spend</p>
                    <p className="text-xl font-bold">${data.averageSpend.toFixed(2)}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Active Cards</p>
                    <p className="text-xl font-bold">{data.activeCards}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Unique Users</p>
                    <p className="text-xl font-bold">{data.uniqueUsers}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
