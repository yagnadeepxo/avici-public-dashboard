import { supabaseServer } from "@/lib/supabaseServer"

interface DebugPageProps {
  params: {
    slug: string
  }
}

export default async function ShareDebugPage({ params }: DebugPageProps) {
  const { data } = await supabaseServer
    .from("card_shares")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!data) {
    return <div>Share not found</div>
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://dashboard.avici.money").replace(/\/$/, "")
  const shareUrl = `${siteUrl}/share/${params.slug}`

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>OG Tag Debug Page</h1>
      <p>Use this page to test Open Graph tags. Share URL: <a href={shareUrl}>{shareUrl}</a></p>
      
      <h2>Current Data:</h2>
      <pre style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
        {JSON.stringify(data, null, 2)}
      </pre>

      <h2>OG Tags (as they appear in HTML):</h2>
      <pre style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
{`<meta property="og:title" content="${data.label} · Avici Dashboard" />
<meta property="og:description" content="Live card stats powered by Avici." />
<meta property="og:image" content="${data.image_url}" />
<meta property="og:url" content="${shareUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${data.label} · Avici Dashboard" />
<meta name="twitter:description" content="Live card stats powered by Avici." />
<meta name="twitter:image" content="${data.image_url}" />`}
      </pre>

      <h2>Image Preview:</h2>
      <img 
        src={data.image_url} 
        alt={data.label}
        style={{ maxWidth: "100%", border: "1px solid #ddd", borderRadius: "8px" }}
      />

      <h2>Test Tools:</h2>
      <ul>
        <li>
          <a href={`https://cards-dev.twitter.com/validator`} target="_blank" rel="noopener">
            Twitter Card Validator
          </a>
        </li>
        <li>
          <a href={`https://www.opengraph.xyz/url/${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener">
            OpenGraph.xyz Debugger
          </a>
        </li>
        <li>
          <a href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener">
            Facebook Sharing Debugger
          </a>
        </li>
      </ul>

      <h2>Common Issues:</h2>
      <ul>
        <li>Image must be publicly accessible (check if image URL loads in browser)</li>
        <li>Image should be at least 300x157px (Twitter minimum)</li>
        <li>Image URL must be absolute (not relative)</li>
        <li>Twitter caches OG tags - use the validator to refresh cache</li>
        <li>HTTPS is required for images</li>
      </ul>
    </div>
  )
}

