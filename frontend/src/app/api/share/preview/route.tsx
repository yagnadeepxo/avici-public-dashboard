import { ImageResponse } from "next/og"
import { NextResponse } from "next/server"

export const runtime = "edge"

const WIDTH = 1200
const HEIGHT = 630

interface PreviewPayload {
  label: string
  value: string
  change?: number | null
  timePeriod: string
  customBackgroundImage?: string | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreviewPayload
    const { label, value, change, timePeriod, customBackgroundImage } = body

    if (!label || !value || !timePeriod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const changeLabel =
      typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : null

    const changeColor =
      typeof change === "number"
        ? change > 0
          ? "#22c55e"
          : change < 0
            ? "#6b7280"
            : "#a3a3a3"
        : "#a3a3a3"

    // Get the base URL for the image
    const host = request.headers.get("host")
    const protocol = host?.includes("localhost") ? "http" : "https"
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (host ? `${protocol}://${host}` : "http://localhost:3000")
    
    const cardBackgroundUrl = `${baseUrl}/card_background.png`

    // Calculate font size based on value length
    const valueLength = value.length
    let fontSize = 150
    let fontWeight = 900
    
    if (valueLength > 12) {
      fontSize = 100
      fontWeight = 900
    } else if (valueLength > 10) {
      fontSize = 120
      fontWeight = 900
    } else if (valueLength > 8) {
      fontSize = 135
      fontWeight = 900
    }

    // Label text layer
    const labelLayer = (
      <div
        style={{
          position: "absolute",
          top: "280px",
          left: "118.37px",
          width: "963.4811401367188px",
          height: "47.89156723022461px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
          fontWeight: 400,
          fontSize: "39.76px",
          lineHeight: "100%",
          letterSpacing: "0.17em",
          textAlign: "center",
          color: "#5C5C5C",
          opacity: 1,
        }}
      >
        {label}
      </div>
    )

    // Value text layer with gradient - responsive font size, bold and fat
    const valueLayer = (
      <div
        style={{
          position: "absolute",
          top: "360px",
          left: "100px",
          width: "1000px",
          height: "150px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
          fontWeight: fontWeight,
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize}px`,
          letterSpacing: "-0.02em",
          textAlign: "center",
          background: "linear-gradient(180deg, #2F2F2F -51.12%, #898989 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          opacity: 1,
          textShadow: "none",
        }}
      >
        <span style={{ fontWeight: 900 }}>{value}</span>
      </div>
    )

    // Percentage change and timeframe container
    const changeAndTimeframeLayer = changeLabel ? (
      <div
        style={{
          position: "absolute",
          top: "530px",
          left: "481.83px",
          width: "237.240966796875px",
          height: "58.1204833984375px",
          display: "flex",
          alignItems: "center",
          gap: "18.07px",
          paddingBottom: "3px",
          opacity: 1,
        }}
      >
        {/* Percentage change text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: changeColor,
            fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
            fontSize: "24px",
            fontWeight: 600,
          }}
        >
          {changeLabel}
        </div>
        
        {/* Timeframe badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "92.1686782836914px",
            height: "55.1204833984375px",
            borderRadius: "21.69px",
            backgroundColor: "#F2F2F2",
            gap: "9.04px",
            padding: "0 12px",
            fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
            fontSize: "22px",
            fontWeight: 500,
            color: "#5C5C5C",
          }}
        >
          {timePeriod.toUpperCase()}
        </div>
      </div>
    ) : (
      // If no change, just show timeframe
      <div
        style={{
          position: "absolute",
          top: "530px",
          left: "481.83px",
          display: "flex",
          alignItems: "center",
          opacity: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "92.1686782836914px",
            height: "55.1204833984375px",
            borderRadius: "21.69px",
            backgroundColor: "#F2F2F2",
            gap: "9.04px",
            padding: "0 12px",
            fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
            fontSize: "22px",
            fontWeight: 500,
            color: "#5C5C5C",
          }}
        >
          {timePeriod.toUpperCase()}
        </div>
      </div>
    )

    // Footer text layer
    const footerLayer = (
      <div
        style={{
          position: "absolute",
          top: "586.48px",
          left: "30px",
          width: "228px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          fontFamily: "SF Pro Rounded, system-ui, -apple-system, sans-serif",
          fontWeight: 400,
          fontSize: "20px",
          lineHeight: "100%",
          letterSpacing: "0.2em",
          color: "#5C5C5C",
          opacity: 1,
          whiteSpace: "nowrap",
          overflow: "visible",
        }}
      >
        avici.money | stats
      </div>
    )

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            fontFamily: "SF Pro Rounded, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={cardBackgroundUrl}
            alt=""
            style={{
              width: `${WIDTH}px`,
              height: `${HEIGHT}px`,
              opacity: 1,
            }}
          />
          {labelLayer}
          {valueLayer}
          {changeAndTimeframeLayer}
          {footerLayer}
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      }
    )

    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${base64}`,
    })
  } catch (error) {
    console.error("Preview generation failed:", error)
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 })
  }
}