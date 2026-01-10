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
import { useIronDailySummary } from "@/hooks/useIronDailySummary"
import { Card, CardContent } from "@/components/ui/card"

export function IronOnrampVolumeHistogram() {
  // Get all-time data by not providing date filters
  const { data, loading, error } = useIronDailySummary()

  const dailyData =
    data?.daily_summaries?.map((item) => {
      const date = new Date(item.date)
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dateFull: item.date,
        onrampVolumeUSD: parseFloat(item.summary.onramp_volume_usd) || 0,
      }
    }) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p 
          className="text-sm text-muted-foreground mb-2"
          style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
        >
          Daily Onramp Volume
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
                tickFormatter={(val) => `$${Number(val).toLocaleString('en-US')}`}
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
                formatter={(val: number) => [
                  `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Onramp Volume",
                ]}
              />
              <Bar
                dataKey="onrampVolumeUSD"
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

