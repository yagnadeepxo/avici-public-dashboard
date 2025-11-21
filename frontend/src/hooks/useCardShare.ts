import { useState, useCallback } from "react"

export type TimePeriod = "all" | "24h" | "7d" | "30d"

export interface ShareRequest {
  label: string
  value: string
  change?: number | null
  timePeriod: TimePeriod
  customBackgroundImage?: string | null
}

export interface SharePreview extends ShareRequest {
  imageDataUrl: string
}

const GENERIC_ERROR = "Unable to generate preview right now. Please try again."

export function useCardShare() {
  const [sharePreview, setSharePreview] = useState<SharePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const handleCardShare = useCallback(
    async (payload: ShareRequest) => {
      setIsGeneratingPreview(true)
      setPreviewError(null)
      try {
        const response = await fetch("/api/share/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Preview generation failed")
        }

        const data = await response.json()
        if (!data.imageDataUrl) {
          throw new Error("Invalid preview payload")
        }

        setSharePreview({
          ...payload,
          imageDataUrl: data.imageDataUrl as string,
        })
        setIsPreviewOpen(true)
      } catch (error) {
        console.error("Failed to generate share preview:", error)
        setPreviewError(
          error instanceof Error ? error.message || GENERIC_ERROR : GENERIC_ERROR
        )
      } finally {
        setIsGeneratingPreview(false)
      }
    },
    []
  )

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false)
    setSharePreview(null)
    setPreviewError(null)
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
    isGeneratingPreview,
    previewError,
  }
}
