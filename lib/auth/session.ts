import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { isAuthEnabled } from "@/lib/auth/config"
import type { Profile } from "@/lib/types"

export async function getSessionUser() {
  if (!isAuthEnabled()) return null
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function requireSessionUser() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  return user
}

export async function requireUserId(): Promise<string | null> {
  const user = await getSessionUser()
  if (!user) {
    if (isAuthEnabled()) redirect("/login")
    return null
  }
  return user.id
}

function normalizeProfile(row: Profile): Profile {
  return {
    ...row,
    avatar_url: row.avatar_url ?? null,
    emoji: row.emoji || "🙂",
    avatar_source: row.avatar_source === "google" ? "google" : "emoji",
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getSessionUser()
  if (!user) return null

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)

  if (data) return normalizeProfile(data as Profile)

  const meta = user.user_metadata ?? {}
  const avatarUrl =
    typeof meta.avatar_url === "string" ? meta.avatar_url : null
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "User"

  const inserted: Profile = {
    id: user.id,
    email: user.email ?? "",
    name,
    avatar_url: avatarUrl,
    emoji: "🙂",
    avatar_source: avatarUrl ? "google" : "emoji",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: created, error: insertError } = await db
    .from("profiles")
    .upsert(inserted)
    .select("*")
    .single()

  if (insertError) throw new Error(insertError.message)
  return normalizeProfile(created as Profile)
}

export async function requireCurrentProfile(): Promise<Profile> {
  await requireSessionUser()
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  return profile
}

export { displayAvatar } from "@/lib/auth/display-avatar"
