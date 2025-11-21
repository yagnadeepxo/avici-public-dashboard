"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useStats } from "@/hooks/useDashboardStats"
import { usePercentChange } from "@/hooks/usePercentChange"
import { SpendHistogram } from "@/components/spendHistogram"
import { SpendHistogramAll } from "@/components/spendHistogramAll"
import { ActiveCardsAll } from "@/components/activeCardsHistogramAll"
import { CumulativeSpendGraph } from "@/components/cumulativeSpendHistogramAll"
import { ActiveCardsDynamic } from "@/components/activeCardsHistogramDynamic"
import { SpendHistogramDynamic } from "./spendHistogramDynamic"
import { CumulativeSpendDynamic } from "./cumulativeSpendHistogramDynamic"
import { CumulativeSpendHour } from "./cumulativeSpendHistogramHour"
import { ActiveCardsHour } from "./activeCardsHistogramHour"
import { ShareableStatCard } from "./ShareableStatCard"
import { SharePreviewModal } from "./SharePreviewModal"
import { useCardShare, type TimePeriod } from "@/hooks/useCardShare"

type Category = "card spends"

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [category, setCategory] = useState<Category>("card spends")
  
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

  const changesByPeriod: Record<
    TimePeriod,
    ReturnType<typeof usePercentChange>["changes"]
  > = {
    "24h": dailyChanges,
    "7d": weeklyChanges,
    "30d": monthlyChanges,
    all: dailyChanges,
  }

  const activeChanges = changesByPeriod[timePeriod]

  const shouldShowChanges =
    timePeriod === "all" ||
    timePeriod === "24h" ||
    timePeriod === "7d" ||
    timePeriod === "30d"

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Avici Public Dashboard
          </h1>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-0">
          {(["card spends"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                px-4 py-2.5 font-medium text-sm capitalize rounded-t-lg
                transition-all duration-200
                ${
                  category === cat
                    ? "bg-card border border-border border-b-0 text-foreground translate-y-[1px]"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-card border border-border rounded-b-lg rounded-tr-lg p-4 md:p-6">
          {/* Time Period Selector */}
          <div className="flex gap-2 mb-6">
            {(["24h", "7d", "30d", "all"] as const).map((period) => (
              <Button
                key={period}
                onClick={() => setTimePeriod(period)}
                variant={timePeriod === period ? "default" : "outline"}
                className="font-medium text-sm"
              >
                {period.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {previewError && (
              <div className="text-sm text-red-500 border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2">
                {previewError}
              </div>
            )}
            {/* Card Spends Category */}
            {category === "card spends" && (
              <>
                {loading && (
                  <p className="text-muted-foreground text-sm">Loading stats...</p>
                )}
                {error && <p className="text-red-500 text-sm">Error: {error}</p>}

                {data && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <ShareableStatCard
                        label="Total Spends"
                        value={`$${(data.totalSpends / 100).toLocaleString()}`}
                        change={activeChanges?.totalSpends}
                        showChange={shouldShowChanges}
                        timePeriod={timePeriod}
                        onShare={handleCardShare}
                        isPreparingShare={isGeneratingPreview}
                      />
                      <ShareableStatCard
                        label="Total Transactions"
                        value={data.totalTransactions.toLocaleString()}
                        change={activeChanges?.totalTransactions}
                        showChange={shouldShowChanges}
                        timePeriod={timePeriod}
                        onShare={handleCardShare}
                        isPreparingShare={isGeneratingPreview}
                      />
                      <ShareableStatCard
                        label="Total Credit Created"
                        value={`$${(data.totalCreditCreated / 100).toLocaleString()}`}
                        change={activeChanges?.totalCreditCreated}
                        showChange={shouldShowChanges}
                        timePeriod={timePeriod}
                        onShare={handleCardShare}
                        isPreparingShare={isGeneratingPreview}
                      />
                      <ShareableStatCard
                        label="Average Spend"
                        value={`$${(data.averageSpend / 100).toFixed(2)}`}
                        change={activeChanges?.averageSpend}
                        showChange={shouldShowChanges}
                        timePeriod={timePeriod}
                        onShare={handleCardShare}
                        isPreparingShare={isGeneratingPreview}
                      />
                      <ShareableStatCard
                        label="Active Cards"
                        value={data.activeCards}
                        change={activeChanges?.activeCards}
                        showChange={shouldShowChanges}
                        timePeriod={timePeriod}
                        onShare={handleCardShare}
                        isPreparingShare={isGeneratingPreview}
                      />
                      <ShareableStatCard
                        label="Active Users"
                        value={data.uniqueUsers}
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
                        <ActiveCardsHour />
                      </div>
                    )}

                    {timePeriod === "7d" && (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                        <SpendHistogramDynamic daysBack={7} />
                        <CumulativeSpendDynamic daysBack={7} />
                        </div>
                        <ActiveCardsDynamic daysBack={7} />
                      </div>
                    )}

                    {timePeriod === "30d" && (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                        <SpendHistogramDynamic daysBack={30} />
                        <CumulativeSpendDynamic daysBack={30} />
                        </div>
                        <ActiveCardsDynamic daysBack={30} />
                      </div>
                    )}

                    {timePeriod === "all" && (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-3">
                          <SpendHistogramAll />
                          <CumulativeSpendGraph />
                        </div>
                        <ActiveCardsAll />
                      </div>
                    )}


                  </>
                )}
              </>
            )}
            
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
