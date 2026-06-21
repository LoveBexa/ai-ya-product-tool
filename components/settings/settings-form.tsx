"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/auth/user-avatar"
import { updateUserProfile } from "@/app/actions/profile"
import { PROFILE_EMOJI_PICKS, ACCOUNT_SUPPORT_EMAIL } from "@/lib/auth/constants"
import type { Profile } from "@/lib/types"

export function SettingsForm({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial)
  const [name, setName] = useState(initial.name)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const hasGooglePhoto = Boolean(profile.avatar_url)

  function save(fields: Parameters<typeof updateUserProfile>[0]) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const next = await updateUserProfile(fields)
        setProfile(next)
        setName(next.name)
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.")
      }
    })
  }

  function pickEmoji(emoji: string) {
    setProfile((p) => ({ ...p, emoji, avatar_source: "emoji" }))
    save({ emoji, avatar_source: "emoji" })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </p>

        <div className="mt-4 flex items-start gap-4">
          <UserAvatar profile={profile} size="lg" />
          <div className="min-w-0 flex-1">
            <label className="text-sm font-medium" htmlFor="name">
              Display name
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={pending || name.trim() === profile.name}
                onClick={() => save({ name })}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Avatar</p>
          {hasGooglePhoto && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => save({ avatar_source: "google" })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  profile.avatar_source === "google"
                    ? "border-mint bg-mint/20 text-foreground"
                    : "border-border hover:bg-secondary",
                )}
              >
                Google photo
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => save({ avatar_source: "emoji" })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  profile.avatar_source === "emoji"
                    ? "border-mint bg-mint/20 text-foreground"
                    : "border-border hover:bg-secondary",
                )}
              >
                Emoji
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-10 gap-1.5">
            {PROFILE_EMOJI_PICKS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={pending}
                aria-label={`Use ${emoji}`}
                onClick={() => pickEmoji(emoji)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-secondary",
                  profile.emoji === emoji &&
                    profile.avatar_source === "emoji" &&
                    "bg-mint/25 ring-1 ring-mint/50",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {saved && (
          <p className="mt-4 text-xs text-mint-foreground">Saved.</p>
        )}
        {error && <p className="mt-4 text-sm text-alert-text">{error}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To delete your account and all associated data, email{" "}
          <a
            href={`mailto:${ACCOUNT_SUPPORT_EMAIL}?subject=AIYA%20account%20deletion%20request`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {ACCOUNT_SUPPORT_EMAIL}
          </a>
          . We handle deletion requests manually — there is no self-serve delete button.
        </p>
      </section>
    </div>
  )
}
