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
import { useWalletTransactionAll } from "@/hooks/useWalletTransactionAll"
import { Card, CardContent } from "@/components/ui/card"

export function CumulativeTransactionVolume() {
  const { data, loading, error } = useWalletTransactionAll()

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading cumulative transaction data...
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

  // Compute cumulative transaction volume over time
  let runningTotal = 0
  const cumulativeData =
    data?.graph_data?.map((item) => {
      runningTotal += item.volume
      return {
        date: new Date(item.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cumulativeVolumeUSD: runningTotal,
      }
    }) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Cumulative Transaction Volume
        </p>
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
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(val: number) => [
                  `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Cumulative Volume"
                ]}
              />
              {/* Black trendline for cumulative volume */}
              <Line
                type="monotone"
                dataKey="cumulativeVolumeUSD"
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