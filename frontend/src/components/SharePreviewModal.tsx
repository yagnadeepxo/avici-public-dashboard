"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageDown, Loader2, X } from "lucide-react"
import type { SharePreview } from "@/hooks/useCardShare"

// X (Twitter) logo component
const XLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

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
  const abortControllerRef = useRef<AbortController | null>(null)
  const isUploadingRef = useRef(false)

  if (!isOpen) return null

  const uploadWithRetry = async (
    payload: {
      imageDataUrl: string
      label: string
      timePeriod: string
    },
    retries = 2,
    delay = 1000
  ): Promise<Response> => {
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Create timeout promise (15 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort()
        reject(new Error("Upload timeout: Request took too long. Please check your connection and try again."))
      }, 15000)
    })

    // Create fetch promise
    const fetchPromise = fetch("/api/share/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    try {
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      return response
    } catch (error) {
      // If aborted, don't retry
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Upload timeout: Request took too long. Please check your connection and try again.")
      }

      // Retry logic
      if (retries > 0 && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        return uploadWithRetry(payload, retries - 1, delay * 2) // Exponential backoff
      }

      throw error
    }
  }

  const handleShareToTwitter = async () => {
    // Prevent duplicate clicks
    if (isUploadingRef.current || isSharing) {
      return
    }

    try {
      isUploadingRef.current = true
      setIsSharing(true)
      setShareError(null)

      const response = await uploadWithRetry({
        imageDataUrl: sharePreview.imageDataUrl,
        label: sharePreview.label,
        timePeriod: sharePreview.timePeriod,
      })

      const data = await response.json()
      const intentUrl = new URL("https://twitter.com/intent/tweet")
      intentUrl.searchParams.set("url", data.shareUrl)
      intentUrl.searchParams.set(
        "text",
        `Live card stats from Avici – ${sharePreview.label} (${sharePreview.timePeriod.toUpperCase()})`
      )

      // Detect mobile devices - use window.location.href for mobile to avoid popup blockers
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768

      if (isMobile) {
        // On mobile, navigate directly (won't be blocked by popup blockers)
        window.location.href = intentUrl.toString()
      } else {
        // On desktop, open in new tab
        window.open(intentUrl.toString(), "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("Share error:", error)
      let errorMessage = "Unable to share to X right now. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = error.message
        } else if (error.message.includes("Failed to upload")) {
          errorMessage = "Failed to upload image. Please check your connection and try again."
        } else {
          errorMessage = error.message
        }
      }
      
      setShareError(errorMessage)
    } finally {
      setIsSharing(false)
      isUploadingRef.current = false
      abortControllerRef.current = null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
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
              variant="outline"
              className="gap-2"
              onClick={onDownload}
            >
              <ImageDown className="w-4 h-4" />
              Download PNG
            </Button>
            <Button
              className="gap-2"
              onClick={handleShareToTwitter}
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XLogo className="w-4 h-4" />
              )}
              {isSharing ? "Preparing..." : "Share to X"}
            </Button>
          </div>
          {shareError ? (
            <p className="text-xs text-red-500">{shareError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
