"use client"

import { useEffect } from "react"

interface ShareData {
  slug: string
  image_url: string
  label: string
  time_period: string
}

interface ShareRedirectClientProps {
  data: ShareData
}

export default function ShareRedirectClient({ data }: ShareRedirectClientProps) {
  useEffect(() => {
    // Redirect after 3 seconds to give crawlers time to read OG tags
    const timer = setTimeout(() => {
      window.location.href = "/"
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ padding: "20px", textAlign: "center", fontFamily: "system-ui", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <h1>Redirecting to Avici Card Stats...</h1>
      <p>If you are not redirected, <a href="/">click here</a>.</p>
      <img 
        src={data.image_url} 
        alt={data.label}
        style={{ maxWidth: "600px", width: "100%", marginTop: "20px", borderRadius: "8px" }}
      />
    </div>
  )
}

