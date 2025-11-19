import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10)

interface UploadPayload {
  imageDataUrl: string
  label: string
  timePeriod: string
}

const bucketName = process.env.NEXT_PUBLIC_BUCKET_NAME || process.env.SUPABASE_BUCKET_NAME
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")

if (!bucketName) {
  throw new Error("Missing NEXT_PUBLIC_BUCKET_NAME or SUPABASE_BUCKET_NAME env variable")
}

export async function POST(request: Request) {
  try {
    const { imageDataUrl, label, timePeriod } = (await request.json()) as UploadPayload

    if (!imageDataUrl?.startsWith("data:image")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 })
    }

    if (!label || !timePeriod) {
      return NextResponse.json({ error: "Missing label or timePeriod" }, { status: 400 })
    }

    const base64Content = imageDataUrl.split(",")[1]
    if (!base64Content) {
      return NextResponse.json({ error: "Malformed image data" }, { status: 400 })
    }

    const buffer = Buffer.from(base64Content, "base64")
    const slug = nanoid()
    const filePath = `${slug}.png`

    const { error: uploadError } = await supabaseServer.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload image", 
        details: uploadError.message 
      }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from(bucketName).getPublicUrl(filePath)

    const insertPayload = {
      slug,
      image_url: publicUrl,
      label,
      time_period: timePeriod,
    }

    const { error: insertError } = await supabaseServer.from("card_shares").insert(insertPayload)

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ 
        error: "Failed to store metadata", 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      slug,
      imageUrl: publicUrl,
      shareUrl: `${siteUrl}/share/${slug}`,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

