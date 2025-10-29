"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TimeSeriesChart from "./time_series_chart"
import CurrencyBreakdown from "./currency_breakdown"

type TimePeriod = "all" | "24h" | "7d" | "30d"
type ActiveSection = "card-spends" | "onramp" | "wallet"

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d")
  const [activeSection, setActiveSection] = useState<ActiveSection>("card-spends")

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Avici Public Dashboard</h1>
        </div>

        {/* Time Period Filter */}
        <div className="flex gap-2 mb-6">
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <Button
              key={period}
              onClick={() => setTimePeriod(period)}
              variant={timePeriod === period ? "default" : "outline"}
              className="font-medium text-sm capitalize"
            >
              {period === "all" ? "All" : period}
            </Button>
          ))}
        </div>

        {/* Main Section Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {(["card-spends", "onramp", "wallet"] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeSection === section
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {section === "card-spends" && "Card Spends"}
              {section === "onramp" && "Onramp Volume"}
              {section === "wallet" && "Wallet"}
            </button>
          ))}
        </div>

        {/* Card Spends Section */}
        {activeSection === "card-spends" && (
          <div className="space-y-4">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Spends</p>
                  <p className="text-xl font-bold">$124,580</p>
                  <p className="text-xs text-muted-foreground mt-1">+12.5%</p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Txns</p>
                  <p className="text-xl font-bold">2,847</p>
                  <p className="text-xs text-muted-foreground mt-1">+8.2%</p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Avg. Spend</p>
                  <p className="text-xl font-bold">$43.78</p>
                  <p className="text-xs text-muted-foreground mt-1">-2.1%</p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Active Cards</p>
                  <p className="text-xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground mt-1">+1</p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Unique Users</p>
                  <p className="text-xl font-bold">1,335</p>
                  <p className="text-xs text-muted-foreground mt-1">+6.4%</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Card Spends Trend {i}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimeSeriesChart title="Card Spends" period={timePeriod} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Onramp Volume Section */}
        {activeSection === "onramp" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: "Total Onramp", value: "$89,450", change: "+15.3%" },
                { title: "Total Offramp", value: "$34,200", change: "+5.2%" },
                { title: "Net Volume", value: "$55,250", change: "+22.1%" },
                { title: "Avg. Transaction", value: "$1,245", change: "+3.8%" },
              ].map((item) => (
                <Card key={item.title} className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.title}</p>
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Onramp Volume Trend {i}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimeSeriesChart title="Onramp Volume" period={timePeriod} />
                  </CardContent>
                </Card>
              ))}
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Currency Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <CurrencyBreakdown period={timePeriod} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Wallet Section */}
        {activeSection === "wallet" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: "Total Balance", value: "$156,890", change: "+8.5%" },
                { title: "Swap Volume", value: "$78,450", change: "+11.2%" },
                { title: "Deposit Volume", value: "$92,300", change: "+6.9%" },
                { title: "Active Assets", value: "8", change: "+2" },
              ].map((item) => (
                <Card key={item.title} className="border border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.title}</p>
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Wallet Activity Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeSeriesChart title="Wallet Activity" period={timePeriod} />
                </CardContent>
              </Card>

              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Asset Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CurrencyBreakdown period={timePeriod} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
