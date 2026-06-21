"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/auth/user-avatar"
import { getProfileForMenu, signOutAction } from "@/app/actions/profile"
import { isAuthEnabled } from "@/lib/auth/config"
import type { Profile } from "@/lib/types"

export function AccountMenu({
  className,
  initialProfile = null,
}: {
  className?: string
  initialProfile?: Profile | null
}) {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [loading, setLoading] = useState(!initialProfile && isAuthEnabled())
  const [signingOut, startSignOut] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
      setLoading(false)
      return
    }
    if (!isAuthEnabled()) {
      setLoading(false)
      return
    }
    getProfileForMenu()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [initialProfile])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  if (!isAuthEnabled()) {
    return (
      <Link
        href="/login"
        className={cn(
          "rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary",
          className,
        )}
      >
        Sign in
      </Link>
    )
  }

  if (loading) {
    return (
      <span className={cn("flex h-9 w-9 items-center justify-center", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </span>
    )
  }

  if (!profile) {
    return (
      <Link
        href="/login"
        className={cn(
          "rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary",
          className,
        )}
      >
        Sign in
      </Link>
    )
  }

  const displayName = profile.name || profile.email.split("@")[0] || "Account"

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-secondary"
      >
        <UserAvatar profile={profile} size="sm" />
        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[8rem] truncate text-sm font-medium">{displayName}</p>
          <p className="max-w-[8rem] truncate text-[10px] text-muted-foreground">
            {profile.email}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm transition-colors hover:bg-secondary"
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-50"
            onClick={() => {
              setOpen(false)
              startSignOut(() => signOutAction())
            }}
          >
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  )
}
