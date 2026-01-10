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

  // Compute cumulative spend over time
  let runningTotal = 0
  const cumulativeData =
    data?.graphData?.map((item) => {
      runningTotal += item.totalSpend / 100 // convert cents → dollars
      const date = new Date(item.timestamp)
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dateFull: item.timestamp, // Keep full timestamp for tooltip
        cumulativeSpendUSD: runningTotal,
      }
    }) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Cumulative Spend Over Time
        </p>
        {error && (
          <p className="text-xs text-red-500 mb-2">
            Error: {error}
          </p>
        )}
        {data && (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumulativeData}>
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
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]?.payload?.dateFull) {
                    const date = new Date(payload[0].payload.dateFull)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  return label
                }}
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
        )}
        {!data && !loading && !error && (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}