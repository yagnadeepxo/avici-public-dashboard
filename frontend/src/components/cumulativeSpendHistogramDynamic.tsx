// CumulativeSpendDynamic.tsx
"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useSpendVolumeDynamic } from "@/hooks/useSpendVolumeDynamic"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface CumulativeSpendDynamicProps {
  timeFrame?: string
  daysBack: number
}

export function CumulativeSpendDynamic({ timeFrame = "24h", daysBack }: CumulativeSpendDynamicProps) {
  const { data, loading, error } = useSpendVolumeDynamic(timeFrame, daysBack)

  // For 30d and 7d, use period aggregation; for others, use daily data
  const shouldUsePeriodAggregation = daysBack === 30 || daysBack === 7
  
  let cumulativeData: Array<{ date: string; cumulativeSpendUSD: number; isOngoing?: boolean }> = []
  
  if (shouldUsePeriodAggregation && data?.graphData) {
    // Sort data by timestamp (oldest first)
    const sortedData = [...data.graphData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    if (daysBack === 30) {
      // For 30d: Group by month (Mar, Apr, May, etc.) starting from March
      const now = new Date()
      const currentYear = now.getUTCFullYear()
      const currentMonth = now.getUTCMonth()
      
      const monthlyData: Map<string, { month: string; sum: number; isCurrent: boolean }> = new Map()
      
      sortedData.forEach((item) => {
        const date = new Date(item.timestamp)
        const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`
        const monthName = date.toLocaleDateString("en-US", { month: "short" })
        const isCurrent = date.getUTCFullYear() === currentYear && date.getUTCMonth() === currentMonth
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { month: monthName, sum: 0, isCurrent })
        }
        const monthData = monthlyData.get(monthKey)!
        monthData.sum += item.totalSpend / 100 // convert cents → dollars
        monthData.isCurrent = isCurrent // Update in case of multiple entries
      })
      
      // Convert to array and sort by month (chronologically), then calculate cumulative
      const monthlyArray = Array.from(monthlyData.entries())
        .sort((a, b) => {
          const [yearA, monthA] = a[0].split('-').map(Number)
          const [yearB, monthB] = b[0].split('-').map(Number)
          if (yearA !== yearB) return yearA - yearB
          return monthA - monthB
        })
        .map(([_, data]) => data)
      
      let runningTotal = 0
      cumulativeData = monthlyArray.map((data, index, array) => {
        runningTotal += data.sum
        return {
          date: index === array.length - 1 && data.isCurrent ? `${data.month}*` : data.month,
          cumulativeSpendUSD: runningTotal,
          isOngoing: index === array.length - 1 && data.isCurrent,
        }
      })
    } else if (daysBack === 7) {
      // For 7d: Group into 7-day periods starting from Sunday
      if (sortedData.length === 0) {
        cumulativeData = []
      } else {
        // Find the first Sunday in the data
        let firstSundayIndex = -1
        for (let i = 0; i < sortedData.length; i++) {
          const date = new Date(sortedData[i].timestamp)
          const dayOfWeek = date.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
          if (dayOfWeek === 0) {
            firstSundayIndex = i
            break
          }
        }
        
        // If no Sunday found, start from the first data point
        const startIndex = firstSundayIndex >= 0 ? firstSundayIndex : 0
        
        const periods: Array<{ startDate: Date; endDate: Date; sum: number; isComplete: boolean }> = []
        
        // Process data starting from Sunday, grouping into 7-day periods
        for (let i = startIndex; i < sortedData.length; i += 7) {
          let periodSum = 0
          let periodStart = new Date(sortedData[i].timestamp)
          let periodEnd = periodStart
          
          // Sum up available days (even if less than 7)
          const remainingDays = Math.min(7, sortedData.length - i)
          const isComplete = remainingDays === 7
          
          for (let j = 0; j < remainingDays; j++) {
            periodSum += sortedData[i + j].totalSpend / 100 // convert cents → dollars
            periodEnd = new Date(sortedData[i + j].timestamp)
          }
          
          periods.push({
            startDate: periodStart,
            endDate: periodEnd,
            sum: periodSum,
            isComplete,
          })
        }
        
        // Calculate cumulative from period sums
        let runningTotal = 0
        cumulativeData = periods.map((period, index, array) => {
          runningTotal += period.sum
          const isLast = index === array.length - 1
          const dateLabel = `${period.startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${period.endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`
          
          return {
            date: isLast && !period.isComplete ? `${dateLabel}*` : dateLabel,
            cumulativeSpendUSD: runningTotal,
            isOngoing: isLast && !period.isComplete,
          }
        })
      }
    }
  } else {
    // For other timeframes, show cumulative of daily data
    const sortedData = data?.graphData 
      ? [...data.graphData].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      : []
    
    let runningTotal = 0
    cumulativeData = sortedData.map((item) => {
      runningTotal += item.totalSpend / 100 // convert cents → dollars
      return {
        date: new Date(item.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cumulativeSpendUSD: runningTotal,
      }
    })
  }

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">
            {daysBack === 30 
              ? `Cumulative Monthly Spend Volume` 
              : daysBack === 7
              ? `Cumulative 7D Period Spend Volume`
              : `Cumulative Spend Over Time`}
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-500 mb-2">
            Error: {error}
          </p>
        )}
        {data && (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumulativeData}>
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
                tickFormatter={(val) => formatCurrency(Number(val))}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]?.payload?.isOngoing) {
                    // Remove * and add (ongoing) for tooltip
                    const cleanLabel = label.replace(/\*$/, '')
                    return `${cleanLabel} (ongoing)`
                  }
                  return label
                }}
                formatter={(val: number) => [
                  `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Cumulative Spend",
                ]}
              />
              {/* Black trendline for cumulative spend */}
              <Line
                type="monotone"
                dataKey="cumulativeSpendUSD"
                stroke="#000"
                strokeWidth={1.8}
                dot={false}
              />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {!data && !loading && !error && (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}