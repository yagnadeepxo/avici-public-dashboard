"use client"
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
import { LoadingIndicator } from "./LoadingIndicator"
import { useCardShare, type TimePeriod } from "@/hooks/useCardShare"

interface CardsContentProps {
  timePeriod: TimePeriod
}

export function CardsContent({ timePeriod }: CardsContentProps) {
  
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
  const { data, loading, isFetching, error } = useStats(timePeriod)
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

            {/* Always render the grid structure - data will be available from placeholderData */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ShareableStatCard
                label="Total Spends"
                value={data ? `$${((typeof data.totalSpends === 'number' ? data.totalSpends : parseFloat(String(data.totalSpends)) || 0) / 100).toLocaleString('en-US')}` : ''}
                change={activeChanges?.totalSpends}
                showChange={shouldShowChanges}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Total Transactions"
                value={data ? data.totalTransactions.toLocaleString('en-US') : ''}
                change={activeChanges?.totalTransactions}
                showChange={shouldShowChanges}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Total Spend Transactions"
                value={data ? data.spendTransactionCount.toLocaleString('en-US') : ''}
                change={activeChanges?.totalSpendTransactions}
                showChange={shouldShowChanges}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Total Credit Created"
                value={data ? `$${((typeof data.totalCreditCreated === 'number' ? data.totalCreditCreated : parseFloat(String(data.totalCreditCreated)) || 0) / 100).toLocaleString('en-US')}` : ''}
                change={activeChanges?.totalCreditCreated}
                showChange={shouldShowChanges}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Average Spend"
                value={data ? `$${((typeof data.averageSpend === 'number' ? data.averageSpend : parseFloat(String(data.averageSpend)) || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                change={activeChanges?.averageSpend}
                showChange={shouldShowChanges}
                timePeriod={timePeriod}
                onShare={handleCardShare}
                isPreparingShare={isGeneratingPreview}
              />
              <ShareableStatCard
                label="Active Users"
                value={data ? data.uniqueUsers.toLocaleString('en-US') : ''}
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

