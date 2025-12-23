"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useTotalCardSpendAll } from "@/hooks/useTotalCardSpendAll"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export function CumulativeSpendGraph() {
  const { data, loading, error } = useTotalCardSpendAll()

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading cumulative spend data...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-red-500">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  // Compute cumulative spend over time
  let runningTotal = 0
  const cumulativeData =
    data?.graphData?.map((item) => {
      runningTotal += item.totalSpend / 100 // convert cents → dollars
      return {
        date: new Date(item.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cumulativeSpendUSD: runningTotal,
      }
    }) || []

  return (
    <Card className="border border-border bg-background h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col min-h-0">
        <p className="text-sm text-muted-foreground mb-2">
          Cumulative Spend Over Time
        </p>
        <div className="w-full flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cumulativeData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(val) => formatCurrency(Number(val))}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Cumulative Spend"]}
              />
              {/* Black trendline for cumulative spend */}
              <Line
                type="monotone"
                dataKey="cumulativeSpendUSD"
                stroke="#000"
                strokeWidth={1.8}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}