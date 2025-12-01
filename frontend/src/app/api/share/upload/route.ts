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

// TypeScript type assertion - we know bucketName is string after the check above
const BUCKET_NAME: string = bucketName

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

    // Validate and convert base64 to buffer
    let buffer: Buffer
    try {
      buffer = Buffer.from(base64Content, "base64")
      
      // Validate buffer size (max 5MB to prevent abuse)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (buffer.length > maxSize) {
        return NextResponse.json({ 
          error: "Image too large. Maximum size is 5MB." 
        }, { status: 400 })
      }

      if (buffer.length === 0) {
        return NextResponse.json({ error: "Invalid image data: empty buffer" }, { status: 400 })
      }
    } catch (bufferError) {
      console.error("Buffer conversion error:", bufferError)
      return NextResponse.json({ 
        error: "Failed to process image data" 
      }, { status: 400 })
    }

    const slug = nanoid()
    const filePath = `${slug}.png`

    // Upload to Supabase with timeout handling
    let uploadError
    try {
      const uploadPromise = supabaseServer.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: "image/png",
          upsert: false,
        })

      // Add timeout wrapper (12 seconds for upload)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Upload timeout: Storage operation took too long"))
        }, 12000)
      })

      const result = await Promise.race([uploadPromise, timeoutPromise])
      uploadError = result.error
    } catch (timeoutError) {
      console.error("Upload timeout:", timeoutError)
      return NextResponse.json({ 
        error: "Upload timeout: Storage operation took too long. Please try again." 
      }, { status: 504 })
    }

    if (uploadError) {
      console.error("Upload error:", uploadError)
      
      // Handle specific Supabase errors
      if (uploadError.message?.includes("duplicate") || uploadError.message?.includes("already exists")) {
        // Retry with new slug if duplicate (shouldn't happen, but handle gracefully)
        return NextResponse.json({ 
          error: "File already exists. Please try again." 
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: "Failed to upload image to storage", 
        details: uploadError.message 
      }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    const insertPayload = {
      slug,
      image_url: publicUrl,
      label,
      time_period: timePeriod,
    }

    // Insert metadata with timeout handling
    let insertError
    try {
      const insertPromise = supabaseServer.from("card_shares").insert(insertPayload)
      
      // Add timeout wrapper (5 seconds for database insert)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Database timeout: Insert operation took too long"))
        }, 5000)
      })

      const result = await Promise.race([insertPromise, timeoutPromise])
      insertError = result.error
    } catch (timeoutError) {
      console.error("Database insert timeout:", timeoutError)
      // Note: Image is already uploaded, but metadata insert failed
      // In production, you might want to clean up the uploaded file
      return NextResponse.json({ 
        error: "Database timeout: Failed to store metadata. The image was uploaded but may not be accessible." 
      }, { status: 504 })
    }

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
    console.error("Unexpected error in upload route:", error)
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError || (error as any).message?.includes("JSON")) {
      return NextResponse.json({ 
        error: "Invalid request data" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Unexpected server error. Please try again." 
    }, { status: 500 })
  }
}

