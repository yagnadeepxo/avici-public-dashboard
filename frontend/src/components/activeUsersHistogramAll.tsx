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
import { useActiveUserAll } from "@/hooks/useActiveUsersAll"
import { Card, CardContent } from "@/components/ui/card"

export function ActiveUserAll() {
  const { data, loading, error } = useActiveUserAll()

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
        <p className="text-sm text-muted-foreground mb-2">Daily Active Cards</p>
        {error && (
          <p className="text-xs text-red-500 mb-2">Error: {error}</p>
        )}
        {data && (
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
                formatter={(val: number) => [val, "Active Cards"]}
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
