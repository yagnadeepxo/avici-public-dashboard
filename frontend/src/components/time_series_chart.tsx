"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TimeSeriesChartProps {
  title: string
  period: string
}

export default function TimeSeriesChart({ title, period }: TimeSeriesChartProps) {
  // Mock data - replace with real data
  const data = [
    { time: "00:00", value: 4000 },
    { time: "04:00", value: 3000 },
    { time: "08:00", value: 2000 },
    { time: "12:00", value: 2780 },
    { time: "16:00", value: 1890 },
    { time: "20:00", value: 2390 },
    { time: "24:00", value: 3490 },
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="time" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
        <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: `1px solid var(--color-border)`,
            borderRadius: "6px",
            color: "var(--color-foreground)",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-foreground)"
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
