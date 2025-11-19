import { useState, useCallback } from "react"

export type TimePeriod = "all" | "24h" | "7d" | "30d"

export interface SharePreview {
  imageDataUrl: string
  label: string
  timePeriod: TimePeriod
}

export function useCardShare() {
  const [sharePreview, setSharePreview] = useState<SharePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleCardShare = useCallback((imageDataUrl: string, label: string, timePeriod: TimePeriod) => {
    setSharePreview({ imageDataUrl, label, timePeriod })
    setIsPreviewOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false)
    setSharePreview(null)
  }, [])

  const handleDownload = useCallback(() => {
    if (!sharePreview) return
    const link = document.createElement("a")
    link.href = sharePreview.imageDataUrl
    const sanitizedLabel = sharePreview.label.toLowerCase().replace(/\s+/g, "-")
    link.download = `avici-${sanitizedLabel}-${sharePreview.timePeriod}.png`
    link.click()
  }, [sharePreview])

  return {
    sharePreview,
    isPreviewOpen,
    handleCardShare,
    closePreview,
    handleDownload,
  }
}

