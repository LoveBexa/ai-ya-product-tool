"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] route error:", error.message, error.digest)
  }, [error])

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl px-6 py-20">
        <div className="rounded-2xl border border-border bg-card p-7">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something <span className="serif-accent">went wrong</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page hit an error while loading. The details below can help
            pin down the cause.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-secondary p-3.5">
            <p className="font-mono text-xs leading-relaxed text-foreground break-words">
              {error.message || "Unknown error"}
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                digest: {error.digest}
              </p>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full bg-secondary px-5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
