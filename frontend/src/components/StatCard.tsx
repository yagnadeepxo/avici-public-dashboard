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
    <Card className="border border-border bg-background md:flex-1 flex flex-col py-2">
      <CardContent className="p-2 md:flex-1 flex flex-col justify-between">
        <p 
          className="text-[10px] text-muted-foreground mb-0.5"
          style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
        >
          {label}
        </p>
        <div className="flex items-end gap-1.5">
          <p 
            className="text-base font-bold"
            style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
          >
            {value}
          </p>
          {hasChange && (
            <div
              className={`flex items-center gap-0.5 text-[10px] font-medium pb-0.5 ${
                isPositive
                  ? "text-green-600"
                  : isNegative
                  ? "text-gray-600"
                  : "text-muted-foreground"
              }`}
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              {isPositive ? (
                <ArrowUp className="w-2.5 h-2.5" />
              ) : isNegative ? (
                <ArrowDown className="w-2.5 h-2.5" />
              ) : null}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

