import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
// Prefer service role key for server-side operations (bypasses RLS)
// Fallback to anon key if service role not available
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are not configured.")
}

// Check if we're using service role key
const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// Log warning if using anon key for server operations
if (!isServiceRole && process.env.NODE_ENV !== "production") {
  console.warn("⚠️  Using anon key for server operations. Consider using SUPABASE_SERVICE_ROLE_KEY for better security.")
}

