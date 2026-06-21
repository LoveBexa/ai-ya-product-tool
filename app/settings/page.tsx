import Link from "next/link"
import { BrandMark } from "@/components/brand-mark"
import { AccountMenu } from "@/components/project/account-menu"
import { SettingsForm } from "@/components/settings/settings-form"
import { requireCurrentProfile } from "@/lib/auth/session"
import { isAuthEnabled } from "@/lib/auth/config"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Settings — AIYA",
}

export default async function SettingsPage() {
  if (!isAuthEnabled()) {
    redirect("/start")
  }

  const profile = await requireCurrentProfile()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark href="/start" showTagline={false} />
          <AccountMenu initialProfile={profile} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/start"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to projects
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and avatar.
        </p>
        <div className="mt-8">
          <SettingsForm initial={profile} />
        </div>
      </main>
    </div>
  )
}
