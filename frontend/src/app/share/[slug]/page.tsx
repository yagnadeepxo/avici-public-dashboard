import { redirect } from "next/navigation"
import type { Metadata, ResolvingMetadata } from "next"
import { supabaseServer } from "@/lib/supabaseServer"
import ShareRedirectClient from "./ShareRedirectClient"

interface SharePageProps {
  params: Promise<{
    slug: string
  }>
}

async function fetchShare(slug: string) {
  const { data } = await supabaseServer
    .from("card_shares")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
  return data
}

export async function generateMetadata(
  { params }: SharePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchShare(slug)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const description = `Live card stats from Avici - ${data?.label} (${data?.time_period?.toUpperCase() || ""})`
  const imageUrl = data?.image_url

  const metadataBase = siteUrl
  const shareUrl = `${siteUrl}/share/${slug}`

  const openGraph = {
    description,
    url: shareUrl,
    siteName: "Avici Card Stats",
    images: imageUrl ? [{ 
      url: imageUrl, 
      width: 1200, 
      height: 630, 
      alt: data?.label ?? "Avici Card stats" 
    }] : [],
    type: "website" as const,
  }

  const twitter = imageUrl
    ? {
        card: "summary_large_image" as const,
        description,
        images: [imageUrl],
        creator: "@AviciMoney",
      }
    : undefined

  return {
    metadataBase,
    description,
    openGraph,
    twitter,
    alternates: {
      canonical: shareUrl,
    },
  }
}

export default async function ShareRedirectPage({ params }: SharePageProps) {
  const { slug } = await params
  const data = await fetchShare(slug)

  if (!data) {
    redirect("/")
    return
  }

  // Render a proper React component so metadata is included
  return <ShareRedirectClient data={data} />
}

