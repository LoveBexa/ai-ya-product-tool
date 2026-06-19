import Link from "next/link"
import { AppShell } from "@/components/app-shell"

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Project <span className="serif-accent">not found</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This project may have been removed, or the database could not be
          reached.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to projects
        </Link>
      </div>
    </AppShell>
  )
}
