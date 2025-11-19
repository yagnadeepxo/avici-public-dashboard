"use client"

import { Button } from "@/components/ui/button"
import { ImageDown, Twitter, X } from "lucide-react"
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
  if (!isOpen) return null

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
            <Button variant="outline" className="gap-2" disabled>
              <Twitter className="w-4 h-4" />
              Share to Twitter (soon)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Download now, and the Twitter share button will arrive in a
            future update.
          </p>
        </div>
      </div>
    </div>
  )
}

