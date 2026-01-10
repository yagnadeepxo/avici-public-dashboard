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
import { useWalletSwapVolume } from "@/hooks/useWalletSwapVolume"
import { Card, CardContent } from "@/components/ui/card"

export function CumulativeSwapVolume() {
  const { data, loading, error } = useWalletSwapVolume()

  // Compute cumulative swap volume over time
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
          Cumulative Swap Volume
        </p>
        {error && (
          <p className="text-xs text-red-500 mb-2">Error: {error}</p>
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
        )}
        {!data && !loading && !error && (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}