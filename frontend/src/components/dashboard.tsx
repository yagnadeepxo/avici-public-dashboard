"use client"

import { useState, useEffect } from "react"
import { useStats } from "@/hooks/useDashboardStats"
import { usePercentChange } from "@/hooks/usePercentChange"
import { useAlltimePercentChange } from "@/hooks/useAlltimePercentChange"
import { SpendHistogram } from "@/components/spendHistogram"
import { SpendHistogramAll } from "@/components/spendHistogramAll"
import { CumulativeSpendGraph } from "@/components/cumulativeSpendHistogramAll"
import { SpendHistogramDynamic } from "./spendHistogramDynamic"
import { CumulativeSpendDynamic } from "./cumulativeSpendHistogramDynamic"
import { CumulativeSpendHour } from "./cumulativeSpendHistogramHour"
import { ShareableStatCard } from "./ShareableStatCard"
import { SharePreviewModal } from "./SharePreviewModal"
import { PasscodeGate } from "./PasscodeGate"
import { useCardShare, type TimePeriod } from "@/hooks/useCardShare"

const STORAGE_KEY = "dashboard_passcode_validated"

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [isPasscodeValidated, setIsPasscodeValidated] = useState<boolean | null>(null)
  
  const {
    sharePreview,
    isPreviewOpen,
    handleCardShare,
    closePreview,
    handleDownload,
    isGeneratingPreview,
    previewError,
  } = useCardShare()

  // Card spends data
  const { data, loading, error } = useStats(timePeriod)
  const { changes: dailyChanges } = usePercentChange(1)
  const { changes: weeklyChanges } = usePercentChange(7)
  const { changes: monthlyChanges } = usePercentChange(30)
  const { changes: alltimeChanges } = useAlltimePercentChange()

  const changesByPeriod: Record<
    TimePeriod,
    ReturnType<typeof usePercentChange>["changes"]
  > = {
    "24h": dailyChanges,
    "7d": weeklyChanges,
    "30d": monthlyChanges,
    all: alltimeChanges
  }

  const activeChanges = changesByPeriod[timePeriod]

  const shouldShowChanges =
    timePeriod === "all" ||
    timePeriod === "24h" ||
    timePeriod === "7d" ||
    timePeriod === "30d"

  // Check localStorage on mount
  useEffect(() => {
    const validated = localStorage.getItem(STORAGE_KEY) === "true"
    setIsPasscodeValidated(validated)
  }, [])

  // Auto-refresh page every 6 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      window.location.reload()
    }, 6 * 60 * 1000) // 6 minutes in milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval)
  }, [])

  const handlePasscodeSuccess = () => {
    setIsPasscodeValidated(true)
  }

  // Show loading state while checking localStorage
  if (isPasscodeValidated === null) {
    return null
  }

  // Show passcode gate if not validated
  if (!isPasscodeValidated) {
    return <PasscodeGate onSuccess={handlePasscodeSuccess} />
  }

  return (
    <div 
      className="min-h-screen bg-background p-4 md:p-6"
      style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Time Period Selector */}
        <div className="mb-6">
          <h1 
            className="text-2xl font-medium text-foreground mb-4"
            style={{ 
              fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: 'normal'
            }}
          >
            Avici Card Stats
          </h1>
          
          {/* Time Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {(["24h", "7d", "30d", "all"] as const).map((period) => {
              const displayText = period === "24h" ? "24 H" : period === "7d" ? "7D" : period === "30d" ? "30 D" : "ALL";
              const isActive = timePeriod === period;
              
              return (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`
                    px-4 py-2 font-medium text-sm rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-white border border-border text-foreground shadow-sm"
                        : "bg-transparent text-foreground hover:bg-muted/50"
                    }
                  `}
                  style={{ 
                    fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif'
                  }}
                >
                  {displayText}
                </button>
              );
            })}
          </div>
        </div>

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
            
            {loading && (
              <p 
                className="text-muted-foreground text-sm"
                style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
              >
                Loading stats...
              </p>
            )}
            {error && (
              <p 
                className="text-red-500 text-sm"
                style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
              >
                Error: {error}
              </p>
            )}

            {data && (
              <>
                <div className="flex flex-col md:flex-row gap-3 md:h-[calc(100vh-220px)] overflow-hidden">
                  {/* Left Column - All 6 Cards Stacked (30% on desktop, full width on mobile) */}
                  <div className="w-full md:w-[30%] flex flex-col gap-1 md:min-h-0">
                    <ShareableStatCard
                      label="Total Spends"
                      value={`$${(data.totalSpends / 100).toLocaleString('en-US')}`}
                      change={activeChanges?.totalSpends}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                    <ShareableStatCard
                      label="Total Transactions"
                      value={data.totalTransactions.toLocaleString('en-US')}
                      change={activeChanges?.totalTransactions}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                    <ShareableStatCard
                      label="Total Spend Transactions"
                      value={data.spendTransactionCount.toLocaleString('en-US')}
                      change={activeChanges?.totalSpendTransactions}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                    <ShareableStatCard
                      label="Total Credit Created"
                      value={`$${(data.totalCreditCreated / 100).toLocaleString('en-US')}`}
                      change={activeChanges?.totalCreditCreated}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                    <ShareableStatCard
                      label="Average Spend"
                      value={`$${(data.averageSpend / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      change={activeChanges?.averageSpend}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                    <ShareableStatCard
                      label="Active Users"
                      value={data.uniqueUsers.toLocaleString('en-US')}
                      change={activeChanges?.uniqueUsers}
                      showChange={shouldShowChanges}
                      timePeriod={timePeriod}
                      onShare={handleCardShare}
                      isPreparingShare={isGeneratingPreview}
                    />
                  </div>
                  
                  {/* Right Column - Graphs Stacked (70% on desktop, full width on mobile) */}
                  <div className="w-full md:w-[70%] flex flex-col gap-3 md:min-h-0">
                    {timePeriod === "24h" && (
                      <>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <SpendHistogram />
                        </div>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <CumulativeSpendHour />
                        </div>
                      </>
                    )}

                    {timePeriod === "7d" && (
                      <>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <SpendHistogramDynamic daysBack={7} />
                        </div>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <CumulativeSpendDynamic daysBack={7} />
                        </div>
                      </>
                    )}

                    {timePeriod === "30d" && (
                      <>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <SpendHistogramDynamic daysBack={30} />
                        </div>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <CumulativeSpendDynamic daysBack={30} />
                        </div>
                      </>
                    )}

                    {timePeriod === "all" && (
                      <>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <SpendHistogramAll />
                        </div>
                        <div className="md:flex-1 md:min-h-0 flex flex-col">
                          <CumulativeSpendGraph />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
            
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
