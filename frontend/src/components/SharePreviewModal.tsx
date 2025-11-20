"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageDown, Loader2, Twitter, X } from "lucide-react"
import type { SharePreview } from "@/hooks/useCardShare"

interface SharePreviewModalProps {
  sharePreview: SharePreview
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export function SharePreviewModal({
  sharePreview,
  isOpen,
  onClose,
  onDownload,
}: SharePreviewModalProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleShareToTwitter = async () => {
    try {
      setIsSharing(true)
      setShareError(null)

      const response = await fetch("/api/share/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: sharePreview.imageDataUrl,
          label: sharePreview.label,
          timePeriod: sharePreview.timePeriod,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const data = await response.json()
      const intentUrl = new URL("https://twitter.com/intent/tweet")
      intentUrl.searchParams.set("url", data.shareUrl)
      intentUrl.searchParams.set(
        "text",
        `Live card stats from Avici – ${sharePreview.label} (${sharePreview.timePeriod.toUpperCase()})`
      )

      window.open(intentUrl.toString(), "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("Share error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unable to share to Twitter right now. Please try again."
      setShareError(errorMessage)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Share Preview</p>
            <p className="text-base font-semibold">
              {sharePreview.label} - {sharePreview.timePeriod.toUpperCase()}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
            <span className="sr-only">Close preview</span>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <img
            src={sharePreview.imageDataUrl}
            alt={`${sharePreview.label} card preview for ${sharePreview.timePeriod}`}
            className="w-full rounded-md border border-border"
          />
        </div>
        <div className="border-t border-border px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="gap-2"
              onClick={onDownload}
            >
              <ImageDown className="w-4 h-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShareToTwitter}
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Twitter className="w-4 h-4" />
              )}
              {isSharing ? "Preparing..." : "Share to Twitter"}
            </Button>
          </div>
          {shareError ? (
            <p className="text-xs text-red-500">{shareError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              When you share, we’ll host this image with Open Graph metadata so it pops right into your tweet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

