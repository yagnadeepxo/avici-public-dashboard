"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Share2 } from "lucide-react"
import { toPng } from "html-to-image"
import { StatCard, StatCardProps } from "./StatCard"
import type { TimePeriod } from "@/hooks/useCardShare"

interface ShareableStatCardProps extends StatCardProps {
  timePeriod: TimePeriod
  onShare: (imageDataUrl: string, label: string, timePeriod: TimePeriod) => void
  customBackgroundImage?: string | null
}

export function ShareableStatCard({ 
  label, 
  value, 
  change, 
  showChange, 
  timePeriod,
  onShare,
  customBackgroundImage 
}: ShareableStatCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCapture = useCallback(async () => {
    if (!cardRef.current) return

    setIsCapturing(true)
    try {
      // Find the actual card element (the Card component with data-slot="card")
      const cardElement = cardRef.current.querySelector('[data-slot="card"]') as HTMLElement
      if (!cardElement) {
        console.error("Card element not found")
        return
      }

      // First, capture the card itself
      const cardDataUrl = await toPng(cardElement, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 2,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor || "#ffffff",
      })

      // Create a canvas to composite the card image with the time period label
      const img = new Image()
      img.src = cardDataUrl
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Set canvas size with padding for the label
      const padding = 20
      canvas.width = img.width + (padding * 2)
      canvas.height = img.height + (padding * 2)

      // Draw custom background if provided
      if (customBackgroundImage) {
        const bgImg = new Image()
        bgImg.crossOrigin = 'anonymous'
        bgImg.src = customBackgroundImage
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve
          bgImg.onerror = reject
        })
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
      } else {
        // Fill with background color
        ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor || "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Draw the card image
      ctx.drawImage(img, padding, padding, img.width, img.height)

      // Draw time period label background
      const labelX = padding + img.width - 100
      const labelY = padding + 10
      const labelWidth = 80
      const labelHeight = 28
      const labelRadius = 6

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.beginPath()
      ctx.moveTo(labelX + labelRadius, labelY)
      ctx.lineTo(labelX + labelWidth - labelRadius, labelY)
      ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + labelRadius)
      ctx.lineTo(labelX + labelWidth, labelY + labelHeight - labelRadius)
      ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - labelRadius, labelY + labelHeight)
      ctx.lineTo(labelX + labelRadius, labelY + labelHeight)
      ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - labelRadius)
      ctx.lineTo(labelX, labelY + labelRadius)
      ctx.quadraticCurveTo(labelX, labelY, labelX + labelRadius, labelY)
      ctx.closePath()
      ctx.fill()

      // Draw time period label text
      ctx.fillStyle = "#ffffff"
      ctx.font = "700 11px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(
        timePeriod.toUpperCase(),
        labelX + labelWidth / 2,
        labelY + labelHeight / 2
      )

      const finalDataUrl = canvas.toDataURL('image/png')
      onShare(finalDataUrl, label, timePeriod)
    } catch (error) {
      console.error("Failed to capture card", error)
    } finally {
      setIsCapturing(false)
    }
  }, [label, timePeriod, onShare, customBackgroundImage])

  return (
    <div className="relative group">
      <div ref={cardRef}>
        <StatCard 
          label={label} 
          value={value} 
          change={change} 
          showChange={showChange} 
        />
      </div>
      <Button
        onClick={handleCapture}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        disabled={isCapturing}
        title="Share this card"
      >
        {isCapturing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  )
}

