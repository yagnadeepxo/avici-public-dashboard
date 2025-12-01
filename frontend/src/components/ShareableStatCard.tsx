"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Share2 } from "lucide-react"
import { StatCard, StatCardProps } from "./StatCard"
import type { ShareRequest, TimePeriod } from "@/hooks/useCardShare"

interface ShareableStatCardProps extends StatCardProps {
  timePeriod: TimePeriod
  onShare: (payload: ShareRequest) => Promise<void> | void
  customBackgroundImage?: string | null
  isPreparingShare?: boolean
}

export function ShareableStatCard({
  label,
  value,
  change,
  showChange,
  timePeriod,
  onShare,
  customBackgroundImage,
  isPreparingShare = false,
}: ShareableStatCardProps) {
  const handleShare = useCallback(() => {
    const formattedValue =
      typeof value === "number" ? value.toString() : value

    onShare({
      label,
      value: formattedValue,
      change: typeof change === "number" ? change : null,
      timePeriod,
      customBackgroundImage: customBackgroundImage ?? null,
    })
  }, [label, value, change, timePeriod, onShare, customBackgroundImage])

  return (
    <div className="relative group">
      <StatCard
        label={label}
        value={value}
        change={change}
        showChange={showChange}
      />
      <Button
        onClick={handleShare}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-7 w-7"
        disabled={isPreparingShare}
        title="Share this card"
      >
        {isPreparingShare ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  )
}