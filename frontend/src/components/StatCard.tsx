"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"

export interface StatCardProps {
  label: string
  value: string | number
  change?: number
  showChange?: boolean
}

export function StatCard({ label, value, change, showChange }: StatCardProps) {
  const hasChange = showChange && change !== undefined && change !== null
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-xl font-bold">{value}</p>
          {hasChange && (
            <div
              className={`flex items-center gap-1 text-xs font-medium pb-0.5 ${
                isPositive
                  ? "text-green-600"
                  : isNegative
                  ? "text-gray-600"
                  : "text-muted-foreground"
              }`}
            >
              {isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : isNegative ? (
                <ArrowDown className="w-3 h-3" />
              ) : null}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

