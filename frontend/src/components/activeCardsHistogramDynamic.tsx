// ActiveCardsDynamic.tsx
"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useActiveCardsDynamic } from "@/hooks/useActiveCardsDynamic"
import { Card, CardContent } from "@/components/ui/card"

interface ActiveCardsDynamicProps {
  timeFrame?: string
  daysBack: number
}

export function ActiveCardsDynamic({ timeFrame = "24h", daysBack }: ActiveCardsDynamicProps) {
  const { data, loading, error } = useActiveCardsDynamic(timeFrame, daysBack)

  // Custom tooltip: show a single "Active Cards" row, all-black text
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    // Prefer the first payload value
    const value = payload[0]?.value ?? 0
    return (
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: "6px 8px",
          color: "#000",
          fontSize: 12,
        }}
      >
        <div style={{ color: "#000", marginBottom: 2 }}>{label}:00 UTC</div>
        <div style={{ color: "#000" }}>Active Cards: {value}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading active card data...
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

  const graphData =
    data?.graphData?.map((item) => ({
      date: new Date(item.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      activeCards: item.activeCards,
    })) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Daily Active Cards (Last {daysBack} Days)
        </p>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={graphData}>
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
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                content={<CustomTooltip />}
                wrapperStyle={{ color: "#000" }}
                labelStyle={{ color: "#000" }}
                itemStyle={{ color: "#000" }}
              />
              {/* Light grey bars for each day's active users */}
              <Bar
                dataKey="activeCards"
                barSize={20}
                fill="rgba(0, 0, 0, 0.08)"
                radius={[4, 4, 0, 0]}
              />
              {/* Black trendline connecting peaks */}
              <Line
                type="monotone"
                dataKey="activeCards"
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