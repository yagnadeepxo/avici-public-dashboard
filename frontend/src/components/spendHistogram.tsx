"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHistogramData } from '@/hooks/useHistogramData'
import { formatCurrency } from "@/lib/utils"

export function SpendHistogram() {
  const { data, loading, error } = useHistogramData()

  if (loading) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hourly Spend Distribution (UTC)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading histogram data...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hourly Spend Distribution (UTC)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Hourly Spend (UTC)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              label={{ value: 'Hour (UTC)', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              dataKey="hour" 
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#6b7280' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              label={{ value: 'spend volume', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#6b7280' }}
              axisLine={{ stroke: '#6b7280' }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={65}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
              labelFormatter={(label) => `${label}:00 UTC`}
              contentStyle={{ 
                backgroundColor: 'white',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="spend" fill="rgba(0, 0, 0, 0.4)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}