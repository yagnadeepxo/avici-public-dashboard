"use client"

import { useMemo } from "react"
import { useSpendVolumeDynamic } from "./useSpendVolumeDynamic"
import { useIronPeriodSummary, type DailyDataPoint } from "./useIronPeriodSummary"
import { useIronDailySummary, type DailySummary } from "./useIronDailySummary"
import { useTotalCardSpendAll } from "./useTotalCardSpendAll"

// Type definitions for card data
interface GraphPoint {
  timestamp: string
  totalSpend: number | string
}

interface UserStatsResponse {
  graphData: GraphPoint[]
}

type VolumeTimePeriod = "24h" | "7d" | "30d" | "all"

export interface CombinedVolumeDataPoint {
  date: string
  dateFull: string // For sorting and tooltips
  totalVolume: number
  cardVolume: number
  onrampVolume: number
  offrampVolume: number
  isOngoing?: boolean
}

export interface CombinedVolumeData {
  data: CombinedVolumeDataPoint[]
  loading: boolean
  error: string | null
}

export function useCombinedVolumeData(timePeriod: VolumeTimePeriod): CombinedVolumeData {
  // Calculate date ranges
  const today = new Date()
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))
  const todayStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)).toISOString()
  const todayDateStr = todayDate.toISOString().split('T')[0] // YYYY-MM-DD

  // Calculate 24h date range (yesterday - 23 days to yesterday)
  const yesterday = new Date(todayDate)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = new Date(yesterday)
  yesterdayStr.setUTCHours(23, 59, 59, 999)
  const startDate24h = new Date(yesterday)
  startDate24h.setUTCDate(startDate24h.getUTCDate() - 23) // 24 days total
  startDate24h.setUTCHours(0, 0, 0, 0)

  // Fetch all possible data sources (hooks must be called unconditionally)
  // For "all" time, fetch from 2025-03-01 to show all available data
  const cardDataAll = useTotalCardSpendAll("24h", "2025-03-01T00:00:00.000Z", todayStr)
  const cardData24h = useTotalCardSpendAll("24h", startDate24h.toISOString(), yesterdayStr.toISOString())
  const cardData7d = useTotalCardSpendAll("24h", "2025-07-13T00:00:00.000Z", todayStr)
  // For 30d, fetch from 2025-03-01 to today to show monthly data from March 2025
  const cardData30d = useTotalCardSpendAll("24h", "2025-03-01T00:00:00.000Z", todayStr)

  // For "all" time, fetch from 2025-03-01 (virtual accounts may not have data before Nov 20, but we'll handle that)
  const virtualAccountAll = useIronDailySummary("2025-03-01", todayDateStr)
  const virtualAccount24h = useIronDailySummary(startDate24h.toISOString().split('T')[0], yesterday.toISOString().split('T')[0])
  // For 7d, use daily summaries so we can aggregate into correct week boundaries (Nov 2 onwards)
  const virtualAccount7d = useIronDailySummary("2025-11-02", todayDateStr)
  const virtualAccount30d = useIronPeriodSummary("30d")

  // Select the appropriate data based on time period
  const cardData = useMemo(() => {
    if (timePeriod === "all") return cardDataAll
    if (timePeriod === "24h") return cardData24h
    if (timePeriod === "7d") return cardData7d
    return cardData30d
  }, [timePeriod, cardDataAll, cardData24h, cardData7d, cardData30d])

  const virtualAccountData = useMemo(() => {
    if (timePeriod === "all") return virtualAccountAll
    if (timePeriod === "24h") return virtualAccount24h
    if (timePeriod === "7d") return virtualAccount7d
    return virtualAccount30d
  }, [timePeriod, virtualAccountAll, virtualAccount24h, virtualAccount7d, virtualAccount30d])

  // Combine the data
  const combinedData = useMemo<CombinedVolumeDataPoint[]>(() => {
    if (cardData.loading || virtualAccountData.loading) return []
    if (!cardData.data || !virtualAccountData.data) return []

    let result: CombinedVolumeDataPoint[] = []

    if (timePeriod === "all") {
      // Match by exact date
      const cardGraphData = (cardData.data as UserStatsResponse | null)?.graphData || []
      const virtualDailySummaries = (virtualAccountData.data as { daily_summaries?: DailySummary[] } | null)?.daily_summaries || []

      // Create a map of dates to card volumes
      const cardVolumeMap = new Map<string, number>()
      cardGraphData.forEach((item: GraphPoint) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0]
        const volume = typeof item.totalSpend === 'number' ? item.totalSpend / 100 : parseFloat(String(item.totalSpend)) / 100
        cardVolumeMap.set(date, (cardVolumeMap.get(date) || 0) + volume)
      })

      // Combine with virtual account data
      virtualDailySummaries.forEach((virtual: DailySummary) => {
        const date = virtual.date.split('T')[0]
        const cardVol = Math.max(0, cardVolumeMap.get(date) || 0)
        const onrampVol = Math.max(0, parseFloat(virtual.summary.onramp_volume_usd || '0'))
        const offrampVol = Math.max(0, parseFloat(virtual.summary.offramp_volume_usd || '0'))
        const totalVol = Math.max(0, cardVol + onrampVol + offrampVol)

        result.push({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(timePeriod === "all" ? { year: "numeric" } : {}),
          }),
          dateFull: date,
          totalVolume: totalVol,
          cardVolume: cardVol,
          onrampVolume: onrampVol,
          offrampVolume: offrampVol,
        })
      })

      // Add any card-only dates
      cardVolumeMap.forEach((cardVol, date) => {
        if (!virtualDailySummaries.some((v: DailySummary) => v.date.split('T')[0] === date)) {
          const positiveCardVol = Math.max(0, cardVol)
          result.push({
            date: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              ...(timePeriod === "all" ? { year: "numeric" } : {}),
            }),
            dateFull: date,
            totalVolume: positiveCardVol,
            cardVolume: positiveCardVol,
            onrampVolume: 0,
            offrampVolume: 0,
          })
        }
      })

      // Filter out today's data - only show up to yesterday
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      result = result.filter((item) => item.dateFull < todayStr)

    } else if (timePeriod === "24h") {
      // Use same logic as "all" but with date-based matching for last 24 days
      const cardGraphData = (cardData.data as UserStatsResponse | null)?.graphData || []
      const virtualDailySummaries = (virtualAccountData.data as { daily_summaries?: DailySummary[] } | null)?.daily_summaries || []

      // Create a map of dates to card volumes
      const cardVolumeMap = new Map<string, number>()
      cardGraphData.forEach((item: GraphPoint) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0]
        const volume = typeof item.totalSpend === 'number' ? item.totalSpend / 100 : parseFloat(String(item.totalSpend)) / 100
        cardVolumeMap.set(date, (cardVolumeMap.get(date) || 0) + volume)
      })

      // Combine with virtual account data
      virtualDailySummaries.forEach((virtual: DailySummary) => {
        const date = virtual.date.split('T')[0]
        const cardVol = cardVolumeMap.get(date) || 0
        const onrampVol = parseFloat(virtual.summary.onramp_volume_usd || '0')
        const offrampVol = parseFloat(virtual.summary.offramp_volume_usd || '0')
        const totalVol = cardVol + onrampVol + offrampVol

        result.push({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          dateFull: date,
          totalVolume: totalVol,
          cardVolume: cardVol,
          onrampVolume: onrampVol,
          offrampVolume: offrampVol,
        })
      })

      // Add any card-only dates
      cardVolumeMap.forEach((cardVol, date) => {
        if (!virtualDailySummaries.some((v: DailySummary) => v.date.split('T')[0] === date)) {
          result.push({
            date: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            dateFull: date,
            totalVolume: cardVol,
            cardVolume: cardVol,
            onrampVolume: 0,
            offrampVolume: 0,
          })
        }
      })

      // Sort and limit to last 24 days
      result.sort((a, b) => new Date(a.dateFull).getTime() - new Date(b.dateFull).getTime())
      result = result.slice(-24)

    } else if (timePeriod === "7d") {
      // Aggregate card data into weekly periods (Sunday to Saturday) starting from Nov 2, 2025
      // Week 0: Nov 2-8 (Sunday to Saturday), Week 1: Nov 9-15, etc.
      const cardGraphData = (cardData.data as UserStatsResponse | null)?.graphData || []
      const virtualDailyData = (virtualAccountData.data as { daily_data?: DailyDataPoint[] } | null)?.daily_data || []

      // Sort card data by date
      const sortedCardData = [...cardGraphData].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Group card data into weekly periods starting from Nov 2, 2025 (Sunday)
      // Nov 2, 2025 is a Sunday
      const weekStartDate = new Date("2025-11-02T00:00:00.000Z")
      
      // Create a map to group card data by week index (Sunday to Saturday weeks)
      const weekMap = new Map<number, { sum: number; startDate: string; endDate: string }>()

      sortedCardData.forEach((item) => {
        const itemDate = new Date(item.timestamp)
        // Calculate days difference from Nov 2, 2025
        const daysDiff = Math.floor((itemDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24))
        // Calculate week index (each week is 7 days, starting from Sunday)
        const weekIndex = Math.floor(daysDiff / 7)
        
        const volume = typeof item.totalSpend === 'number' ? item.totalSpend / 100 : parseFloat(item.totalSpend as string) / 100
        
        if (!weekMap.has(weekIndex)) {
          // Calculate the actual start date of this week (Sunday)
          const weekStart = new Date(weekStartDate)
          weekStart.setUTCDate(weekStart.getUTCDate() + (weekIndex * 7))
          // Calculate end date (Saturday, 6 days after Sunday)
          const weekEnd = new Date(weekStart)
          weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
          weekMap.set(weekIndex, { 
            sum: 0, 
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0]
          })
        }
        
        weekMap.get(weekIndex)!.sum += volume
      })

      // Now we need to also group virtual account daily data into the same weekly periods
      // Get virtual account daily summaries to group them
      const virtualAccountDailySummaries = (virtualAccountData.data as { daily_summaries?: DailySummary[] } | null)?.daily_summaries || []
      
      // Group virtual account data into the same weekly periods (Nov 2 onwards, Sunday to Saturday)
      const virtualWeekMap = new Map<number, { 
        sum: number; 
        startDate: string; 
        endDate: string;
        onrampVol: number;
        offrampVol: number;
      }>()

      virtualAccountDailySummaries.forEach((daily: DailySummary) => {
        const dailyDate = new Date(daily.date.split('T')[0] + 'T00:00:00.000Z')
        const daysDiff = Math.floor((dailyDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysDiff / 7)
        
        const onrampVol = parseFloat(daily.summary.onramp_volume_usd || '0')
        const offrampVol = parseFloat(daily.summary.offramp_volume_usd || '0')
        
        if (!virtualWeekMap.has(weekIndex)) {
          const weekStart = new Date(weekStartDate)
          weekStart.setUTCDate(weekStart.getUTCDate() + (weekIndex * 7))
          const weekEnd = new Date(weekStart)
          weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
          virtualWeekMap.set(weekIndex, {
            sum: 0,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            onrampVol: 0,
            offrampVol: 0,
          })
        }
        
        const weekData = virtualWeekMap.get(weekIndex)!
        weekData.onrampVol += onrampVol
        weekData.offrampVol += offrampVol
        weekData.sum += onrampVol + offrampVol
      })

      // Combine card and virtual account weekly data
      const allWeekIndices = new Set([...weekMap.keys(), ...virtualWeekMap.keys()])
      const sortedWeekIndices = Array.from(allWeekIndices).sort((a, b) => a - b)

      sortedWeekIndices.forEach((weekIndex) => {
        const cardWeekData = weekMap.get(weekIndex) || { sum: 0, startDate: "", endDate: "" }
        const virtualWeekData = virtualWeekMap.get(weekIndex) || { 
          sum: 0, 
          startDate: "", 
          endDate: "",
          onrampVol: 0,
          offrampVol: 0
        }

        // Format week label (e.g., "Nov 2-8")
        const startDate = new Date(cardWeekData.startDate || virtualWeekData.startDate)
        const endDate = new Date(cardWeekData.endDate || virtualWeekData.endDate)
        const startMonth = startDate.toLocaleDateString("en-US", { month: "short" })
        const startDay = startDate.getUTCDate()
        const endMonth = endDate.toLocaleDateString("en-US", { month: "short" })
        const endDay = endDate.getUTCDate()
        
        const weekLabel = startMonth === endMonth
          ? `${startMonth} ${startDay}-${endDay}`
          : `${startMonth} ${startDay} - ${endMonth} ${endDay}`

        const totalVol = cardWeekData.sum + virtualWeekData.onrampVol + virtualWeekData.offrampVol

        // Check if the week is ongoing (today falls within the week's date range)
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const weekStart = new Date(startDate)
        weekStart.setUTCHours(0, 0, 0, 0)
        const weekEnd = new Date(endDate)
        weekEnd.setUTCHours(23, 59, 59, 999)
        const isOngoing = today >= weekStart && today <= weekEnd

        result.push({
          date: weekLabel,
          dateFull: cardWeekData.startDate || virtualWeekData.startDate || new Date().toISOString().split('T')[0],
          totalVolume: totalVol,
          cardVolume: cardWeekData.sum,
          onrampVolume: virtualWeekData.onrampVol,
          offrampVolume: virtualWeekData.offrampVol,
          isOngoing,
        })
      })

    } else if (timePeriod === "30d") {
      // Aggregate card data into monthly periods matching virtual account month boundaries
      const cardGraphData = (cardData.data as UserStatsResponse | null)?.graphData || []
      const virtualDailyData = (virtualAccountData.data as { daily_data?: DailyDataPoint[] } | null)?.daily_data || []

      // Group card data into monthly periods (same as virtual account: by year-month)
      const monthlyCardData = new Map<string, { sum: number; monthKey: string }>()
      
      cardGraphData.forEach((item: GraphPoint) => {
        const date = new Date(item.timestamp)
        const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
        
        // Filter out December months (monthKey ending with "-12")
        if (monthKey.endsWith("-12")) {
          return
        }
        
        const volume = typeof item.totalSpend === 'number' ? item.totalSpend / 100 : parseFloat(String(item.totalSpend)) / 100
        
        if (!monthlyCardData.has(monthKey)) {
          monthlyCardData.set(monthKey, { sum: 0, monthKey })
        }
        monthlyCardData.get(monthKey)!.sum += volume
      })

      // Debug: Log card monthly data
      console.log("🔍 [30d Combined Volume Debug] Card Monthly Data:", 
        Array.from(monthlyCardData.entries()).map(([key, val]) => ({ monthKey: key, volume: val.sum }))
      )

      // Match with virtual account monthly data by month key
      // Virtual account data is in chronological order
      const sortedMonthKeys = Array.from(monthlyCardData.keys()).sort()
      console.log("🔍 [30d Combined Volume Debug] Sorted Month Keys:", sortedMonthKeys)
      console.log("🔍 [30d Combined Volume Debug] Virtual Account Data:", 
        virtualDailyData.map((v: DailyDataPoint) => ({ date: v.date, onramp: v.onramp_volume_usd, offramp: v.offramp_volume_usd }))
      )
      
      virtualDailyData.forEach((virtual: DailyDataPoint, index: number) => {
        // Extract month key from virtual account date label (e.g., "Nov 2025" -> "2025-11")
        // The virtual account date format is "MMM YYYY" for monthly periods
        let monthKey = ""
        try {
          // Try to parse the date label to get the month
          // Virtual account uses labels like "Nov 2025", "Dec 2025", etc.
          const dateMatch = virtual.date.match(/(\w+)\s+(\d{4})/)
          if (dateMatch) {
            const monthName = dateMatch[1]
            const year = dateMatch[2]
            const monthMap: Record<string, string> = {
              "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
              "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
            }
            const monthNum = monthMap[monthName] || "01"
            monthKey = `${year}-${monthNum}`
            
            // Filter out December - skip if it's December
            if (monthName === "Dec") {
              return
            }
          }
        } catch (e) {
          // If parsing fails, use chronological order
        }

        // If we couldn't parse or the month key doesn't exist in card data, try to match
        if (!monthKey || !monthlyCardData.has(monthKey)) {
          // First try chronological order matching
          monthKey = sortedMonthKeys[index] || ""
          
          // If still no match, try to find by checking all card month keys
          // This handles cases where month keys might be slightly different
          if (!monthKey || !monthlyCardData.has(monthKey)) {
            // Find the closest matching month key
            for (const key of sortedMonthKeys) {
              if (key.startsWith(monthKey.split('-')[0])) {
                monthKey = key
                break
              }
            }
          }
        }

        // Skip December months (monthKey ending with "-12")
        if (monthKey.endsWith("-12")) {
          return
        }

        const monthData = monthlyCardData.get(monthKey) || { sum: 0, monthKey }
        const onrampVol = parseFloat(virtual.onramp_volume_usd || '0')
        const offrampVol = parseFloat(virtual.offramp_volume_usd || '0')
        const totalVol = monthData.sum + onrampVol + offrampVol

        // Debug: Log November specifically
        if (virtual.date && virtual.date.toLowerCase().includes('nov')) {
          console.log("🔍 [30d November Debug]:", {
            virtualDate: virtual.date,
            parsedMonthKey: monthKey,
            cardVolume: monthData.sum,
            onrampVol,
            offrampVol,
            totalVol,
            matched: monthlyCardData.has(monthKey),
          })
        }

        result.push({
          date: virtual.date,
          dateFull: monthKey ? `${monthKey}-01` : new Date().toISOString().split('T')[0],
          totalVolume: totalVol,
          cardVolume: monthData.sum,
          onrampVolume: onrampVol,
          offrampVolume: offrampVol,
          isOngoing: virtual.is_ongoing,
        })
      })
    }

    // Sort by dateFull
    result.sort((a, b) => new Date(a.dateFull).getTime() - new Date(b.dateFull).getTime())
    return result
  }, [timePeriod, cardData, virtualAccountData])

  return {
    data: combinedData,
    loading: cardData.loading || virtualAccountData.loading,
    error: cardData.error || virtualAccountData.error || null,
  }
}
