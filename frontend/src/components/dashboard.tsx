"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStats } from "@/hooks/useDashboardStats"
import { SpendHistogram } from "@/components/spendHistogram"
import { TransactionHistogram } from "@/components/countHistogram"
import { SpendVolume7d } from "@/components/spendHistogram7d"
import { CountHistogram7d } from "@/components/countHistogram7d"

type TimePeriod = "all" | "24h" | "7d" | "30d"
type Category = "card spends" | "onramp volume" | "wallet"

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [category, setCategory] = useState<Category>("card spends")
  const { data, loading, error } = useStats(timePeriod)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Avici Public Dashboard</h1>
        </div>

        {/* Category Selector */}
        <div className="flex gap-2 mb-4">
          {(["card spends", "onramp volume", "wallet"] as const).map((cat) => (
            <Button
              key={cat}
              onClick={() => setCategory(cat)}
              variant={category === cat ? "default" : "outline"}
              className="font-medium text-sm capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Time Period Selector */}
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

        <div className="space-y-4">
          {loading && <p className="text-muted-foreground text-sm">Loading stats...</p>}
          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
          
          {/* Card Spends Category */}
          {data && category === "card spends" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Spends</p>
                    <p className="text-xl font-bold">${(data.totalSpends / 100).toLocaleString()}</p>
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
                    <p className="text-xl font-bold">${(data.averageSpend/100).toFixed(2)}</p>
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
              
              {timePeriod === "24h" && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                  <SpendHistogram />
                  <TransactionHistogram />
                </div>
              )}

              {timePeriod === "7d" && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                  <SpendVolume7d/>
                  <CountHistogram7d/>
                </div>
              )}
            </>
          )}

          {/* Onramp Volume Category - Placeholder */}
          {category === "onramp volume" && (
            <Card className="border border-border bg-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Onramp Volume data coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Wallet Category - Placeholder */}
          {category === "wallet" && (
            <Card className="border border-border bg-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Wallet data coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}