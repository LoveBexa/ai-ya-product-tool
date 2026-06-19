import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/* ------------------------------------------------------------------ *
 *  SUPABASE CONNECTION  —  THIS IS THE AREA YOU SET UP LATER
 *
 *  When you connect Supabase to this project (or paste your own keys),
 *  these environment variables get populated automatically:
 *
 *    NEXT_PUBLIC_SUPABASE_URL        e.g. https://xxxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY       (server-only secret, bypasses RLS)
 *
 *  The service role key is used here because all DB access in v1 goes
 *  through our own server routes (no public browser access yet), which
 *  matches the security model described in your Supabase setup notes.
 *
 *  Do NOT hardcode keys here. Add them as project environment variables.
 * ------------------------------------------------------------------ */

let cached: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
    )
  }
  if (cached) return cached
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  )
  return cached
}
