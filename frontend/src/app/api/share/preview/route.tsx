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

    const backgroundLayer = customBackgroundImage ? (
      <div
        key="background"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${customBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.85,
          display: "flex",
        }}
      />
    ) : null

    const gradientLayer = (
      <div
        key="gradient"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.75) 60%, rgba(15,23,42,0.85) 100%)",
          display: "flex",
        }}
      />
    )

    const contentLayer = (
      <div
        key="content"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 24, color: "#94a3b8", marginBottom: 12 }}>{label}</p>
            <p style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>{value}</p>
          </div>
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 999,
              backgroundColor: "#1e293b",
              fontSize: 28,
              fontWeight: 600,
              display: "flex",
            }}
          >
            {timePeriod.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {changeLabel && (
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  color: changeColor,
                }}
              >
                {changeLabel}
              </div>
            )}
            <div style={{ width: 3, height: 64, backgroundColor: "rgba(148,163,184,0.4)" }} />
            <div style={{ fontSize: 32, color: "#cbd5f5" }}>Live card stats from Avici</div>
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#94a3b8",
              display: "flex",
            }}
          >
            avici.money
          </div>
        </div>
      </div>
    )

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            position: "relative",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
          }}
        >
          {backgroundLayer}
          {gradientLayer}
          {contentLayer}
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


