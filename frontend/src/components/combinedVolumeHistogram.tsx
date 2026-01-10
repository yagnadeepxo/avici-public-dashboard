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
import { useCombinedVolumeData } from "@/hooks/useCombinedVolumeData"
import { Card, CardContent } from "@/components/ui/card"

type VolumeTimePeriod = "24h" | "7d" | "30d" | "all"

interface CombinedVolumeHistogramProps {
  timePeriod: VolumeTimePeriod
}

export function CombinedVolumeHistogram({ timePeriod }: CombinedVolumeHistogramProps) {
  const { data, loading, error } = useCombinedVolumeData(timePeriod)

  const getTitle = () => {
    if (timePeriod === "all") return "Daily Combined Volume"
    if (timePeriod === "24h") return "Daily Combined Volume"
    if (timePeriod === "7d") return "Weekly Combined Volume"
    return "Monthly Combined Volume (From Jan 2025)"
  }

  // Filter out negative values and ensure all volumes are >= 0
  const filteredData = data ? data.map((item: any) => ({
    ...item,
    totalVolume: Math.max(0, item.totalVolume || 0),
    cardVolume: Math.max(0, item.cardVolume || 0),
    onrampVolume: Math.max(0, item.onrampVolume || 0),
    offrampVolume: Math.max(0, item.offrampVolume || 0),
  })) : []

  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-4">
        <p 
          className="text-sm text-muted-foreground mb-2"
          style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
        >
          {getTitle()}
        </p>
        {error && (
          <p 
            className="text-xs text-red-500 mb-2"
            style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
          >
            Error: {error}
          </p>
        )}
        {data && (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData}>
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
                angle={timePeriod === "all" ? -45 : 0}
                textAnchor={timePeriod === "all" ? "end" : "middle"}
                height={timePeriod === "all" ? 80 : 30}
                tickFormatter={(value) => {
                  // Find the corresponding data point to check if it's ongoing
                  const dataPoint = filteredData.find((d: any) => d.date === value)
                  const isOngoing = dataPoint?.isOngoing || false
                  
                  // For "all" time period, remove year from x-axis (tooltip shows it)
                  if (timePeriod === "all") {
                    // The value might be a formatted date string like "Jan 7, 2025" or a date
                    try {
                      // Try parsing as date first
                      const date = new Date(value)
                      if (!isNaN(date.getTime())) {
                        const formatted = date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                        return formatted
                      }
                      // If not a valid date, try to extract month and day from string
                      // Format: "Jan 7, 2025" -> "Jan 7"
                      const match = String(value).match(/(\w+)\s+(\d+)/)
                      if (match) {
                        return `${match[1]} ${match[2]}`
                      }
                    } catch {
                      // Fallback: try to remove year if it exists
                      const formatted = String(value).replace(/,?\s*\d{4}$/, '')
                      return formatted
                    }
                  }
                  
                  // For 7d and 30d, add * if ongoing
                  if ((timePeriod === "7d" || timePeriod === "30d") && isOngoing) {
                    return `${value}*`
                  }
                  
                  return value
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(val) => {
                  // Ensure we never show negative values
                  const value = Math.max(0, Number(val))
                  return `$${value.toLocaleString('en-US')}`
                }}
                domain={[0, 'auto']}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ 
                  color: "#000",
                  fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif'
                }}
                labelStyle={{ color: "#000" }}
                itemStyle={{ color: "#000" }}
                labelFormatter={(label, payload) => {
                  if (!payload || !payload[0]?.payload) return label
                  
                  const payloadData = payload[0].payload
                  const isOngoing = payloadData.isOngoing || false
                  
                  let formattedLabel = label
                  
                  // For 30d period, show month only (e.g., "Nov 2025")
                  if (timePeriod === "30d") {
                    // The date field already contains "Nov 2025" format, use it directly
                    formattedLabel = payloadData.date || label
                  }
                  // For 7d period, show week range (already in the date field like "Nov 2-8")
                  else if (timePeriod === "7d") {
                    formattedLabel = payloadData.date || label
                  }
                  // For "all" and "24h", show full date with year
                  else if (payloadData.dateFull) {
                    const date = new Date(payloadData.dateFull)
                    formattedLabel = date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  
                  // Add "ongoing" indicator for 7d and 30d if the period is not completed
                  if ((timePeriod === "7d" || timePeriod === "30d") && isOngoing) {
                    return `${formattedLabel} (ongoing)`
                  }
                  
                  return formattedLabel
                }}
                formatter={(val: number, name: string) => {
                  if (name === "totalVolume") {
                    return [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Total Volume"]
                  }
                  return [val, name]
                }}
              />
              <Bar
                dataKey="totalVolume"
                barSize={20}
                fill="rgba(0, 0, 0, 0.4)"
                radius={[4, 4, 0, 0]}
              />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {!data && !loading && !error && (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p 
              className="text-sm text-muted-foreground"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              No data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



