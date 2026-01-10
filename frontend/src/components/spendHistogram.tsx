"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useHistogramData } from "@/hooks/useHistogramData"

export function SpendHistogram() {
  const { data, loading, error } = useHistogramData()

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Daily Spend Volume (Last 24 Days)
        </p>
        {error && (
          <p className="text-xs text-red-500 mb-2">
            Error: {error}
          </p>
        )}
        {data && (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(val) => `$${Number(val).toLocaleString('en-US')}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(value: number) => [
                  `$${value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  "Daily Spend",
                ]}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload
                  if (point?.timestamp) {
                    const date = new Date(point.timestamp)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  return point?.day || label
                }}
              />
              <Bar
                dataKey="spend"
                barSize={20}
                fill="rgba(0, 0, 0, 0.4)"
                radius={[4, 4, 0, 0]}
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