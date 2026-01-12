"use client"
import { useState, useEffect } from "react"
import { useIronSummary } from "@/hooks/useIronSummary"
import { useIronPeriodSummary } from "@/hooks/useIronPeriodSummary"
import { ShareableStatCard } from "@/components/ShareableStatCard"
import { IronOnrampVolumeHistogram } from "@/components/ironOnrampVolumeHistogram"
import { IronOfframpVolumeHistogram } from "@/components/ironOfframpVolumeHistogram"
import { IronOnrampVolumeHistogram7d } from "@/components/ironOnrampVolumeHistogram7d"
import { IronOfframpVolumeHistogram7d } from "@/components/ironOfframpVolumeHistogram7d"
import { IronOnrampVolumeHistogram30d } from "@/components/ironOnrampVolumeHistogram30d"
import { IronOfframpVolumeHistogram30d } from "@/components/ironOfframpVolumeHistogram30d"
import { IronOnrampVolumeHistogram24h } from "@/components/ironOnrampVolumeHistogram24h"
import { IronOfframpVolumeHistogram24h } from "@/components/ironOfframpVolumeHistogram24h"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { useCardShare, type TimePeriod } from "@/hooks/useCardShare"
import { SharePreviewModal } from "@/components/SharePreviewModal"

export default function VirtualAccountsPage(props: any) {
  // Extract timePeriod from props (when used as component) or searchParams (when used as Next.js route)
  const timePeriod = props?.timePeriod
  const searchParams = props?.searchParams
  const searchParamsValue = searchParams instanceof Promise ? undefined : searchParams
  const activeTimePeriod: TimePeriod = timePeriod || (searchParamsValue?.timePeriod as TimePeriod) || "all"
  
  const {
    sharePreview,
    isPreviewOpen,
    handleCardShare,
    closePreview,
    handleDownload,
    isGeneratingPreview,
    previewError,
  } = useCardShare()

  // Lazy loading: Only fetch data for the selected time period
  // Use enabled parameter to control which query actually runs
  const allDataResult = useIronSummary(activeTimePeriod === "all")
  const period24hResult = useIronPeriodSummary("24h", activeTimePeriod === "24h")
  const period7dResult = useIronPeriodSummary("7d", activeTimePeriod === "7d")
  const period30dResult = useIronPeriodSummary("30d", activeTimePeriod === "30d")
  
  // Select the active data based on current period
  const { data, loading, isFetching, error } = 
    activeTimePeriod === "all" ? allDataResult :
    activeTimePeriod === "24h" ? period24hResult :
    activeTimePeriod === "7d" ? period7dResult :
    period30dResult
  
  // Store previous values for smooth transitions
  const [displayData, setDisplayData] = useState(data)
  
  // Update displayData when new data arrives, keep previous otherwise
  useEffect(() => {
    if (data?.summary) {
      setDisplayData(data)
    }
  }, [data])

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* <ShareableStatCard
                label="Total Transactions"
                value={(displayData?.summary?.total_transactions ?? 0).toLocaleString('en-US')}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              /> */}
              <ShareableStatCard
                label="Total Volume (USD)"
                value={displayData?.summary ? `$${(parseFloat(displayData.summary.combined_volume_usd || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                timePeriod={activeTimePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              {/* <ShareableStatCard
                label="Average Volume (USD)"
                value={displayData?.summary ? `$${(parseFloat(displayData.summary.average_volume_usd || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              /> */}
              {/* <ShareableStatCard
                label="Active Users"
                value={(displayData?.summary?.unique_users ?? 0).toLocaleString('en-US')}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              /> */}
              {/* <ShareableStatCard
                label="Total Onramps"
                value={(displayData?.summary?.total_onramps ?? 0).toLocaleString('en-US')}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Total Offramps"
                value={(displayData?.summary?.total_offramps ?? 0).toLocaleString('en-US')}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              /> */}
              <ShareableStatCard
                label="Onramp Volume (USD)"
                value={displayData?.summary ? `$${(parseFloat(displayData.summary.onramp_volume_usd || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                timePeriod={activeTimePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Offramp Volume (USD)"
                value={displayData?.summary ? `$${(parseFloat(displayData.summary.offramp_volume_usd || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                timePeriod={activeTimePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
            </div>

             {/* {activeTimePeriod === "all" && (
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                  <IronOnrampVolumeHistogram />
                  <IronOfframpVolumeHistogram />
                </div>
              </div>
            )} */}

            {/* {activeTimePeriod === "7d" && (
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                  <IronOnrampVolumeHistogram7d />
                  <IronOfframpVolumeHistogram7d />
                </div>
              </div>
            )}

             {activeTimePeriod === "24h" && (
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                  <IronOnrampVolumeHistogram24h />
                  <IronOfframpVolumeHistogram24h />
                </div>
              </div>
            )} */}

            {/* {activeTimePeriod === "30d" && (
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                  <IronOnrampVolumeHistogram30d />
                  <IronOfframpVolumeHistogram30d />
                </div>
              </div>
            )}   */}

            {/* Description */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
              <p 
                className="text-sm text-muted-foreground leading-relaxed"
                style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
              >
                <strong className="text-foreground">Total onramp volume</strong> refers to users sending fiat and receiving USDC or EURC. <strong className="text-foreground">Total offramp volume</strong> refers to users sending USDC and receiving USD or EUR in their bank accounts.
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


