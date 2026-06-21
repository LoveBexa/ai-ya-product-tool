import type { Profile } from "@/lib/types"

export function displayAvatar(
  profile: Pick<Profile, "avatar_url" | "emoji" | "avatar_source">,
) {
  if (profile.avatar_source === "google" && profile.avatar_url) {
    return { type: "image" as const, url: profile.avatar_url }
  }
  return { type: "emoji" as const, emoji: profile.emoji || "🙂" }
}
