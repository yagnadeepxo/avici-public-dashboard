"use client"

import { useState, useEffect } from "react"
import { useStats } from "@/hooks/useDashboardStats"
import { useIronPeriodSummary } from "@/hooks/useIronPeriodSummary"
import { useIronSummary } from "@/hooks/useIronSummary"
import { useTotalCardSpendAll } from "@/hooks/useTotalCardSpendAll"
import { ShareableStatCard } from "@/components/ShareableStatCard"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { useCardShare, type TimePeriod } from "@/hooks/useCardShare"
import { SharePreviewModal } from "@/components/SharePreviewModal"
import { CombinedVolumeHistogram } from "@/components/combinedVolumeHistogram"
import { CombinedVolumeCumulative } from "@/components/combinedVolumeCumulative"

export default function VolumePage(props: any) {
  // Extract timePeriod from props (when used as component) or searchParams (when used as Next.js route)
  const timePeriod = props?.timePeriod || (props?.searchParams?.timePeriod as TimePeriod) || "all"
  
  const {
    sharePreview,
    isPreviewOpen,
    handleCardShare,
    closePreview,
    handleDownload,
    isGeneratingPreview,
    previewError,
  } = useCardShare()

  // Fetch card stats for the selected time period (already lazy!)
  const { data: cardStats, loading: cardLoading, isFetching: cardFetching, error: cardError } = useStats(timePeriod)
  
  // Lazy loading: Only fetch virtual account data for the selected period
  const allVirtualAccountResult = useIronSummary(timePeriod === "all")
  const period24hResult = useIronPeriodSummary("24h", timePeriod === "24h")
  const period7dResult = useIronPeriodSummary("7d", timePeriod === "7d")
  const period30dResult = useIronPeriodSummary("30d", timePeriod === "30d")
  
  const { data: virtualAccountStats, loading: virtualAccountLoading, isFetching: virtualAccountFetching, error: virtualAccountError } = 
    timePeriod === "all" ? allVirtualAccountResult :
    timePeriod === "24h" ? period24hResult :
    timePeriod === "7d" ? period7dResult :
    period30dResult
  
  // Combine fetching states
  const isFetching = cardFetching || virtualAccountFetching
  
  // Only fetch cardData30dForVolume when we're on the 30d period
  // Note: useTotalCardSpendAll doesn't have an enabled param yet, but it won't fetch if data is cached
  const today = new Date()
  const todayStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)).toISOString()
  const cardData30dForVolume = useTotalCardSpendAll("24h", "2025-03-01T00:00:00.000Z", todayStr)
  
  const loading = cardLoading || virtualAccountLoading
  const error = cardError || virtualAccountError

  // Calculate card values
  const calculateCardVolume = () => {
    if (!cardStats) return null
    
    // For 30d period, calculate from graph data to match virtual account date range (Nov 20 to today)
    // instead of using useStats which uses last 30 days
    if (timePeriod === "30d" && cardData30dForVolume.data?.graphData) {
      // Sum all card volumes from the graph data (Nov 20 to today)
      const totalVolume = cardData30dForVolume.data.graphData.reduce((sum: number, item: any) => {
        const volume = typeof item.totalSpend === 'number' 
          ? item.totalSpend / 100 
          : parseFloat(item.totalSpend as string) / 100
        return sum + volume
      }, 0)
      return totalVolume
    }
    
    // For other periods, use the original calculation from cardStats
    return typeof cardStats.totalSpends === 'string' 
      ? parseFloat(cardStats.totalSpends) / 100 
      : cardStats.totalSpends / 100
  }

  const calculateVirtualAccountVolume = () => {
    if (!virtualAccountStats?.summary) return null
    
    // Use combined_volume_usd if available (already calculated by backend)
    // Otherwise calculate from onramp + offramp
    if (virtualAccountStats.summary.combined_volume_usd) {
      return parseFloat(virtualAccountStats.summary.combined_volume_usd || '0')
    }
    
    const onrampVolume = parseFloat(virtualAccountStats.summary.onramp_volume_usd || '0')
    const offrampVolume = parseFloat(virtualAccountStats.summary.offramp_volume_usd || '0')
    
    return onrampVolume + offrampVolume
  }

  const calculateTotalVolume = () => {
    const cardVolume = calculateCardVolume()
    const virtualAccountVolume = calculateVirtualAccountVolume()
    
    if (cardVolume === null || virtualAccountVolume === null) return null
    
    return cardVolume + virtualAccountVolume
  }

  const calculateTotalTransactions = () => {
    if (!cardStats || !virtualAccountStats?.summary) return null
    
    return cardStats.totalTransactions + virtualAccountStats.summary.total_transactions
  }

  const cardVolume = calculateCardVolume()
  const virtualAccountVolume = calculateVirtualAccountVolume()
  const totalVolume = calculateTotalVolume()
  const totalTransactions = calculateTotalTransactions()
  
  // Store previous calculated values for smooth transitions
  const [displayTotalVolume, setDisplayTotalVolume] = useState<number | null>(null)
  const [displayTotalTransactions, setDisplayTotalTransactions] = useState<number | null>(null)
  const [displayCardUsers, setDisplayCardUsers] = useState<number | null>(null)
  const [displayVirtualAccountUsers, setDisplayVirtualAccountUsers] = useState<number | null>(null)
  
  // Update display values when new data arrives, keep previous otherwise
  useEffect(() => {
    if (totalVolume !== null) {
      setDisplayTotalVolume(totalVolume)
    }
  }, [totalVolume])
  
  useEffect(() => {
    if (totalTransactions !== null) {
      setDisplayTotalTransactions(totalTransactions)
    }
  }, [totalTransactions])
  
  useEffect(() => {
    if (cardStats?.uniqueUsers !== undefined) {
      setDisplayCardUsers(cardStats.uniqueUsers)
    }
  }, [cardStats?.uniqueUsers])
  
  useEffect(() => {
    if (virtualAccountStats?.summary?.unique_users !== undefined) {
      setDisplayVirtualAccountUsers(virtualAccountStats.summary.unique_users)
    }
  }, [virtualAccountStats?.summary?.unique_users])


  return (
    <div 
      className="min-h-screen bg-background px-4 md:px-6 pb-4 md:pb-6"
      style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
    >
      {/* Loading Indicator */}
      <LoadingIndicator isLoading={isFetching} />
      
      <div className="max-w-7xl mx-auto">
        {/* Content Area */}
        <div className="space-y-4">
          {previewError && (
            <div 
              className="text-sm text-red-500 border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              {previewError}
            </div>
          )}
          
          
          {error && (
            <p 
              className="text-red-500 text-sm"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              Error: {error}
            </p>
          )}

          {/* Always render the grid structure - data persists from previous state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Volume Card */}
            <ShareableStatCard
              label="Total Volume"
              value={
                displayTotalVolume !== null
                  ? `$${displayTotalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ""
              }
              timePeriod={timePeriod}
              onShare={handleCardShare}
              isPreparingShare={isGeneratingPreview}
            />

            {/* Total Transactions Card */}
            <ShareableStatCard
              label="Total Transactions"
              value={
                displayTotalTransactions !== null
                  ? displayTotalTransactions.toLocaleString('en-US')
                  : ""
              }
              timePeriod={timePeriod}
              onShare={handleCardShare}
              isPreparingShare={isGeneratingPreview}
            />

            {/* Card Users Card */}
            <ShareableStatCard
              label="Card Users"
              value={displayCardUsers !== null ? displayCardUsers.toLocaleString('en-US') : ''}
              timePeriod={timePeriod}
              onShare={handleCardShare}
              isPreparingShare={isGeneratingPreview}
            />

            {/* Virtual Account Users Card */}
            <ShareableStatCard
              label="Virtual Account Users"
              value={displayVirtualAccountUsers !== null ? displayVirtualAccountUsers.toLocaleString('en-US') : ''}
              timePeriod={timePeriod}
              onShare={handleCardShare}
              isPreparingShare={isGeneratingPreview}
            />
          </div>

          {/* Graphs - always render */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CombinedVolumeHistogram timePeriod={timePeriod} />
            <CombinedVolumeCumulative timePeriod={timePeriod} />
          </div>

          {/* Description */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            <p 
              className="text-sm text-muted-foreground leading-relaxed"
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              Total volume includes card spend, onramp, and offramp activity. We track this as volume since each of these flows has the potential to generate fees.
            </p>
          </div>
        </div>
      </div>

      {sharePreview && (
        <SharePreviewModal
          sharePreview={sharePreview}
          isOpen={isPreviewOpen}
          onClose={closePreview}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}

