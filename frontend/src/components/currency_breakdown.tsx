"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface CurrencyBreakdownProps {
  period: string
}

export default function CurrencyBreakdown({ period }: CurrencyBreakdownProps) {
  const data = [
    { name: "USD", value: 57 },
    { name: "EUR", value: 22 },
    { name: "GBP", value: 12 },
    { name: "Other", value: 9 },
  ]

  // Custom vibrant colors (consistent with dashboards)
  const COLORS = ["orange", "purple", "black", "red"]

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name} (${value}%)`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, name) => [`${value}%`, name]}
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: `1px solid var(--color-border)`,
              borderRadius: "6px",
              color: "var(--color-foreground)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
