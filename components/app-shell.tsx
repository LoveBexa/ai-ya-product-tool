import Link from "next/link"
import { Triangle } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Triangle className="h-3 w-3 fill-primary-foreground text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Analyst</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              / AI Business Analyst
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Projects
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
