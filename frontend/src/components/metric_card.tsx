import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string
  change: string
  period: string
}

export default function MetricCard({ title, value, change, period }: MetricCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <Card className="border border-border bg-card hover:bg-muted/50 transition-colors">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isPositive ? "text-foreground" : "text-foreground"}`}>{change}</span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>
      </CardContent>
    </Card>
  )
}
