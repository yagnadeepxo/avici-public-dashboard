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
import { useWalletTransactionAll } from "@/hooks/useWalletTransactionAll"
import { Card, CardContent } from "@/components/ui/card"

export function WalletTransactionsHistogramAll() {
  const { data, loading, error } = useWalletTransactionAll()

  const dailyData =
    data?.graph_data?.map((item) => ({
      date: new Date(item.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dailyVolumeUSD: item.volume,
      transactionCount: item.count,
    })) || []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Daily Transaction Volume
        </p>
        {error && (
          <p className="text-xs text-red-500 mb-2">Error: {error}</p>
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
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(val: number, name: string) => {
                  if (name === "dailyVolumeUSD") {
                    return [
                      `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Daily Volume"
                    ]
                  }
                  return [val, "Transactions"]
                }}
              />
              {/* Dark grey bars for daily transaction volume */}
              <Bar
                dataKey="dailyVolumeUSD"
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
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}