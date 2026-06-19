import Link from "next/link"
import { Sparkles } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint">
              <Sparkles className="h-4 w-4 text-mint-foreground" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Analyst
            </span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              <span className="serif-accent">your AI business analyst</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/"
              className="rounded-full px-4 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
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
