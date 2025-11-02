import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSpendCount7dData } from "@/hooks/useSpendCount7d"

export function CountHistogram7d() {
  const { data, loading, error } = useSpendCount7dData()

  if (loading) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">7-Day Transaction Count</CardTitle>
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
          <CardTitle className="text-lg font-semibold">7-Day Transaction Count</CardTitle>
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
        <CardTitle className="text-sm font-semibold">7-Day Transaction Count</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              label={{ value: 'Day', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              dataKey="day" 
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#6b7280' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              label={{ value: 'Transaction Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#6b7280' }}
              axisLine={{ stroke: '#6b7280' }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`}
              width={45}
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'Transactions']}
              labelFormatter={(label) => label}
              contentStyle={{ 
                backgroundColor: 'grey', 
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="transactions" fill="black" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}