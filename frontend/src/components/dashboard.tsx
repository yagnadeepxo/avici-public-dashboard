"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStats } from "@/hooks/useDashboardStats"
import { usePercentChange } from "@/hooks/usePercentChange"
import { useVirtualAccountStats } from "@/hooks/useVirtualAccountStats"
import { SpendHistogram } from "@/components/spendHistogram"
import { TransactionHistogram } from "@/components/countHistogram"
import { SpendVolume7d } from "@/components/spendHistogram7d"
import { CountHistogram7d } from "@/components/countHistogram7d"
import { ArrowUp, ArrowDown } from "lucide-react"

type TimePeriod = "all" | "24h" | "7d" | "30d"
type Category = "card spends" | "Virtual account" | "wallet"

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  showChange?: boolean
}

function StatCard({ label, value, change, showChange }: StatCardProps) {
  const hasChange = showChange && change !== undefined && change !== null
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-xl font-bold">{value}</p>
          {hasChange && (
            <div
              className={`flex items-center gap-1 text-xs font-medium pb-0.5 ${
                isPositive
                  ? "text-green-600"
                  : isNegative
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : isNegative ? (
                <ArrowDown className="w-3 h-3" />
              ) : null}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [category, setCategory] = useState<Category>("card spends")
  
  // Card spends data
  const { data, loading, error } = useStats(timePeriod)
  const { changes } = usePercentChange()
  
  // Virtual account data
  const { 
    data: vaData, 
    loading: vaLoading, 
    error: vaError 
  } = useVirtualAccountStats(timePeriod)

  const shouldShowChanges = timePeriod === "all" || timePeriod === "24h"

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Avici Public Dashboard</h1>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-0">
          {(["card spends", "Virtual account", "wallet"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                px-4 py-2.5 font-medium text-sm capitalize rounded-t-lg
                transition-all duration-200
                ${category === cat 
                  ? "bg-card border border-border border-b-0 text-foreground translate-y-[1px]" 
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-card border border-border rounded-b-lg rounded-tr-lg p-4 md:p-6">
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
            {/* Card Spends Category */}
            {category === "card spends" && (
              <>
                {loading && <p className="text-muted-foreground text-sm">Loading stats...</p>}
                {error && <p className="text-red-500 text-sm">Error: {error}</p>}
                
                {data && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <StatCard
                        label="Total Spends"
                        value={`$${(data.totalSpends / 100).toLocaleString()}`}
                        change={changes?.totalSpends}
                        showChange={shouldShowChanges}
                      />

                      <StatCard
                        label="Total Transactions"
                        value={data.totalTransactions.toLocaleString()}
                        change={changes?.totalTransactions}
                        showChange={shouldShowChanges}
                      />

                      <StatCard
                        label="Average Spend"
                        value={`$${(data.averageSpend / 100).toFixed(2)}`}
                        change={changes?.averageSpend}
                        showChange={shouldShowChanges}
                      />

                      <StatCard
                        label="Active Cards"
                        value={data.activeCards}
                        change={changes?.activeCards}
                        showChange={shouldShowChanges}
                      />

                      <StatCard
                        label="Unique Users"
                        value={data.uniqueUsers}
                        change={changes?.uniqueUsers}
                        showChange={shouldShowChanges}
                      />
                    </div>
                    
                    {timePeriod === "24h" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SpendHistogram />
                        <TransactionHistogram />
                      </div>
                    )}

                    {timePeriod === "7d" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SpendVolume7d/>
                        <CountHistogram7d/>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Virtual Account Category */}
            {category === "Virtual account" && (
              <>
                {vaLoading && <p className="text-muted-foreground text-sm">Loading virtual account stats...</p>}
                {vaError && <p className="text-red-500 text-sm">Error: {vaError}</p>}
                
                {vaData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                      label="Total Volume"
                      value={`$${vaData.totalVolume.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`}
                      showChange={false}
                    />

                    <StatCard
                      label="Total Transactions"
                      value={vaData.count.toLocaleString()}
                      showChange={false}
                    />

                    <StatCard
                      label="Unique Virtual Accounts"
                      value={vaData.uniqueVirtualAccounts}
                      showChange={false}
                    />

                    <StatCard
                      label="Unique Customers"
                      value={vaData.uniqueCustomers}
                      showChange={false}
                    />
                  </div>
                )}
              </>
            )}

            {/* Wallet Category - Placeholder */}
            {category === "wallet" && (
              <Card className="border border-border bg-background">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Wallet data coming soon...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}