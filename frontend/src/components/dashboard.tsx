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

  const loadData = async () => {
    const data = await fetch("/api/dashboard/total-stats")
    const json = await data.json()
    console.log(json)
  }

  // Auto-refresh page every 6 minutes
  // useEffect(() => {
  //   const refreshInterval = setInterval(() => {
  //     loadData();
  //   }, 6 * 60 * 1000) // 6 minutes in milliseconds

  //   // Cleanup interval on unmount
  //   return () => clearInterval(refreshInterval)
  // }, [])
  
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <ShareableStatCard
                    label="Total Spends"
                    value={`$${((typeof data.totalSpends === 'string' ? parseFloat(data.totalSpends) : data.totalSpends) / 100).toLocaleString('en-US')}`}
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
                    value={`$${((typeof data.totalCreditCreated === 'string' ? parseFloat(data.totalCreditCreated) : data.totalCreditCreated) / 100).toLocaleString('en-US')}`}
                    change={activeChanges?.totalCreditCreated}
                    showChange={shouldShowChanges}
                    timePeriod={timePeriod}
                    onShare={handleCardShare}
                    isPreparingShare={isGeneratingPreview}
                  />
                  <ShareableStatCard
                    label="Average Spend"
                    value={`$${((typeof data.averageSpend === 'string' ? parseFloat(data.averageSpend) : data.averageSpend) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

                {timePeriod === "24h" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                    <SpendHistogram />
                    <CumulativeSpendHour />
                    </div>
                   
                  </div>
                )}

                {timePeriod === "7d" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                    <SpendHistogramDynamic daysBack={7} />
                    <CumulativeSpendDynamic daysBack={7} />
                    </div>
                    
                  </div>
                )}

                {timePeriod === "30d" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                    <SpendHistogramDynamic daysBack={30} />
                    <CumulativeSpendDynamic daysBack={30} />
                    </div>
                    
                  </div>
                )}

                {timePeriod === "all" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                      <SpendHistogramAll />
                      <CumulativeSpendGraph />
                    </div>
                    
                  </div>
                )}

                {/* Description */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p 
                    className="text-sm text-muted-foreground leading-relaxed"
                    style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
                  >
                    <strong className="text-foreground">Total credit created</strong> refers to users depositing USDC or other supported assets into the card loan contract, which tops up the credit spend balance. <strong className="text-foreground">Total spends</strong> refers to users or businesses spending via our card at online or offline merchants. <strong className="text-foreground">Total transactions</strong> refers to card top ups and spend transactions.
                  </p>
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
