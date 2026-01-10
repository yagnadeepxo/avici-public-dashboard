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
import { useIronPeriodSummary } from "@/hooks/useIronPeriodSummary"
import { Card, CardContent } from "@/components/ui/card"

export function IronOfframpVolumeHistogram24h() {
  const { data, loading, error } = useIronPeriodSummary("24h")

  const dailyData =
    data?.daily_data?.map((item) => {
      // item.date now contains the day label (e.g., "Jan 7")
      // Add * to date label if ongoing
      const dateLabel = item.is_ongoing ? `${item.date}*` : item.date;
      return {
        date: dateLabel,
        dateFull: item.date,
        offrampVolumeUSD: parseFloat(item.offramp_volume_usd) || 0,
        isOngoing: item.is_ongoing,
      }
    }) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p 
            className="text-sm text-muted-foreground"
            style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
          >
            Daily Offramp Volume (24h)
          </p>
          {dailyData.some(d => d.isOngoing) && (
            <span 
              className="text-xs text-muted-foreground italic"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              Ongoing
            </span>
          )}
        </div>
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
                tick={{ fill: "#888", fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
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
                    const isOngoing = payload[0]?.payload?.isOngoing
                    const dayLabel = payload[0].payload.dateFull // Already formatted as "Jan 7"
                    return isOngoing ? `${dayLabel} (Ongoing)` : dayLabel
                  }
                  return label
                }}
                formatter={(val: number) => [
                  `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Offramp Volume",
                ]}
              />
              <Bar
                dataKey="offrampVolumeUSD"
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

