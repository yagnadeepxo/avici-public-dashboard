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

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading daily spend data...
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

  const dailyData =
    data?.graphData?.map((item) => ({
      date: new Date(item.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dailySpendUSD: item.totalSpend / 100, // convert cents → dollars
    })) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Daily Spend Volume
        </p>
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
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(val: number) => [`$${val.toFixed(2)}`, "Daily Spend"]}
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
      </CardContent>
    </Card>
  )
}