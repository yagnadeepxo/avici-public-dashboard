"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHistogramData } from '@/hooks/useHistogramData'

export function SpendHistogram() {
  const { data, loading, error } = useHistogramData()

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading hourly spend data...
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

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Hourly Spend Volume (Last 24 Hours)
        </p>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(value, index) => {
                  const point = data[index]
                  return point ? `${point.hour}` : `${value}`
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(val) => `$${Number(val).toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(value: number) => [
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Hourly Spend",
                ]}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload
                  if (point?.timestamp) {
                    const date = new Date(point.timestamp)
                    const hour = date.getUTCHours()
                    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
                    const day = date.getUTCDate()
                    return `${hour}:00 UTC (${month} ${day})`
                  }
                  return `${label}:00 UTC`
                }}
              />
              <Bar
                dataKey="spend"
                barSize={20}
                fill="rgba(0, 0, 0, 0.4)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}