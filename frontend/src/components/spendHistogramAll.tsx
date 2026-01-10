"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useTotalCardSpendAll } from "@/hooks/useTotalCardSpendAll"
import { Card, CardContent } from "@/components/ui/card"

export function SpendHistogramAll() {
  const { data, loading, error } = useTotalCardSpendAll()

  const dailyData =
    data?.graphData?.map((item) => {
      const date = new Date(item.timestamp)
      // Ensure daily spend is never negative
      const dailySpend = Math.max(0, (typeof item.totalSpend === 'number' ? item.totalSpend : parseFloat(String(item.totalSpend))) / 100)
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dateFull: item.timestamp, // Keep full timestamp for tooltip
        dailySpendUSD: dailySpend,
      }
    }) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p 
          className="text-sm text-muted-foreground mb-2"
          style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
        >
          Daily Spend Volume
        </p>
        {error && (
          <p 
            className="text-xs text-red-500 mb-2"
            style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
          >
            Error: {error}
          </p>
        )}
        {data && (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData}>
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
                tickFormatter={(val) => {
                  // Ensure we never show negative values
                  const value = Math.max(0, Number(val))
                  return `$${value.toLocaleString('en-US')}`
                }}
                domain={[0, 'auto']}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ color: "#000" }}
                labelStyle={{ color: "#000" }}
                itemStyle={{ color: "#000" }}
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
                formatter={(val: number) => {
                  // Ensure we never show negative values in tooltip
                  const value = Math.max(0, val)
                  return [
                    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Daily Spend",
                  ]
                }}
              />
              {/* Dark grey bars for daily spend */}
              <Bar
                dataKey="dailySpendUSD"
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
            <p 
              className="text-sm text-muted-foreground"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              No data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}