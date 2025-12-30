// SpendHistogramDynamic.tsx
"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useSpendVolumeDynamic } from "@/hooks/useSpendVolumeDynamic"
import { Card, CardContent } from "@/components/ui/card"

interface SpendHistogramDynamicProps {
  timeFrame?: string
  daysBack: number
}

export function SpendHistogramDynamic({ timeFrame = "24h", daysBack }: SpendHistogramDynamicProps) {
  const { data, loading, error } = useSpendVolumeDynamic(timeFrame, daysBack)

  if (loading) {
    return (
      <Card className="border border-border bg-background">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading daily spend data...
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

  // For 30d and 7d, aggregate into non-overlapping periods
  // For other timeframes, show daily data
  const shouldUsePeriodAggregation = daysBack === 30 || daysBack === 7
  
  let dailyData: Array<{ date: string; dailySpendUSD: number; isOngoing?: boolean }> = []
  
  if (shouldUsePeriodAggregation && data?.graphData) {
    // Sort data by timestamp (oldest first)
    const sortedData = [...data.graphData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    if (daysBack === 30) {
      // For 30d: Group by month (Jan, Feb, Mar, etc.) starting from January
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
      
      // Convert to array and sort by month (chronologically)
      dailyData = Array.from(monthlyData.entries())
        .sort((a, b) => {
          const [yearA, monthA] = a[0].split('-').map(Number)
          const [yearB, monthB] = b[0].split('-').map(Number)
          if (yearA !== yearB) return yearA - yearB
          return monthA - monthB
        })
        .map(([_, data], index, array) => ({
          date: index === array.length - 1 && data.isCurrent ? `${data.month}*` : data.month,
          dailySpendUSD: data.sum,
          isOngoing: index === array.length - 1 && data.isCurrent,
        }))
    } else if (daysBack === 7) {
      // For 7d: Group into 7-day periods starting from Sunday
      if (sortedData.length === 0) {
        dailyData = []
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
        
        dailyData = periods.map((period, index, array) => {
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
            dailySpendUSD: period.sum,
            isOngoing: isLast && !period.isComplete,
          }
        })
      }
    }
  } else {
    // For other timeframes, show daily data as before
    dailyData =
      data?.graphData?.map((item) => ({
        date: new Date(item.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dailySpendUSD: item.totalSpend / 100, // convert cents → dollars
      })) || []
  }

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          {daysBack === 30 
            ? `Monthly Spend Volume` 
            : daysBack === 7
            ? `7D Period Spend Volume`
            : `Daily Spend Volume (Last ${daysBack} Days)`}
        </p>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData}>
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
                tickFormatter={(val) => `$${Number(val).toLocaleString('en-US')}`}
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
                  daysBack === 30 ? "Monthly Volume" : daysBack === 7 ? "7D Period Volume" : "Daily Spend",
                ]}
              />
              {/* Dark grey bars for daily spend */}
              <Bar
                dataKey="dailySpendUSD"
                barSize={20}
                fill="rgba(0, 0, 0, 0.4)"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}