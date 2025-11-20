import { NextResponse } from "next/server"

const UPSTREAM_BASE_URL =
  process.env.AVICI_CRON_API_URL ||
  "https://avici-cron-production.up.railway.app"

export async function GET(request: Request) {
  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL("/api/total-stats", UPSTREAM_BASE_URL)

  incomingUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value)
  })

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        ...(process.env.AVICI_CRON_API_KEY
          ? { "x-internal-key": process.env.AVICI_CRON_API_KEY }
          : {}),
      },
      cache: "no-store",
    })

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text()
      return NextResponse.json(
        { error: "Failed to fetch upstream total stats", details: errorBody },
        { status: upstreamResponse.status }
      )
    }

    const data = await upstreamResponse.json()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal proxy error", details: (error as Error).message },
      { status: 500 }
    )
  }
}

