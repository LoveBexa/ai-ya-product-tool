"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { requireSessionUser, getCurrentProfile } from "@/lib/auth/session"
import { isAuthEnabled } from "@/lib/auth/config"
import type { AvatarSource, Profile } from "@/lib/types"

export async function signOutAction() {
  if (!isAuthEnabled()) {
    redirect("/")
  }
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function updateUserProfile(fields: {
  name?: string
  emoji?: string
  avatar_source?: AvatarSource
}): Promise<Profile> {
  const user = await requireSessionUser()
  const db = getSupabaseAdmin()

  const current = await getCurrentProfile()
  if (!current) throw new Error("Profile not found.")

  const update: Record<string, string> = {}
  if (fields.name !== undefined) {
    update.name = fields.name.trim().slice(0, 80) || "User"
  }
  if (fields.emoji !== undefined) {
    update.emoji = fields.emoji.trim().slice(0, 8) || "🙂"
  }
  if (fields.avatar_source !== undefined) {
    if (fields.avatar_source === "google" && !current.avatar_url) {
      throw new Error("Connect Google sign-in to use your Google photo.")
    }
    update.avatar_source = fields.avatar_source
  }

  if (Object.keys(update).length === 0) return current

  const { data, error } = await db
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("*")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  revalidatePath("/start")
  return data as Profile
}

export async function getProfileForMenu(): Promise<Profile | null> {
  if (!isAuthEnabled()) return null
  return getCurrentProfile()
}
