"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHistogramData } from '@/hooks/useTransactionCountData'

export function TransactionHistogram() {
  const { data, loading, error } = useHistogramData()
  console.log(data)

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Hourly Transaction Count (UTC)</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {error && (
          <p className="text-red-500 text-sm mb-2">Error: {error}</p>
        )}
        {data && data.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
    <XAxis 
        dataKey="hour" 
        label={{ value: 'Hour (UTC)', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
        tick={{ fontSize: 10 }}
        tickLine={{ stroke: '#6b7280' }}
        axisLine={{ stroke: '#6b7280' }}
    />
    <YAxis 
      label={{ value: 'Transaction Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
      tick={{ fontSize: 9 }}
      axisLine={{ stroke: '#6b7280' }}
      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
    />
    <Tooltip 
      formatter={(v: number) => [`${v.toLocaleString()} transactions`, 'Count']}
      labelFormatter={(l) => `${l}:00 UTC`}
      contentStyle={{
        backgroundColor: 'grey',
        border: '1px solid #374151',
        borderRadius: '6px',
        fontSize: '11px',
        padding: '6px 8px',
      }}
    />
              <Bar dataKey="count" fill="rgba(0, 0, 0, 0.08)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {(!data || data.length === 0) && !loading && !error && (
          <div className="w-full h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
