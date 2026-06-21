import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "#how-it-works", label: "What you get" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#why-aiya", label: "Why AIYA" },
]

function LogoMark({ dark = true, className }: { dark?: boolean; className?: string }) {
  return (
    <BrandMark href="/" showTagline={false} dark={dark} className={className} />
  )
}

export function LandingNav({ dark = true }: { dark?: boolean }) {
  const headerSurface = dark
    ? "border-white/10 bg-[#0a0a0f]"
    : "border-border bg-background/80"

  const linkClass = cn(
    "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
    dark
      ? "text-white/70 hover:bg-white/10 hover:text-white"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  )

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b",
          headerSurface,
          !dark && "backdrop-blur-md",
        )}
      >
        {/* Desktop */}
        <div className="mx-auto hidden h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:flex">
          <LogoMark dark={dark} />

          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label }) => (
              <a key={label} href={href} className={linkClass}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
            <Link
              href="/start"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-mint px-5 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90"
            >
              Start a project
            </Link>
          </div>
        </div>

        {/* Mobile — logo centered, links sticky below */}
        <div className="lg:hidden">
          <div
            className={cn(
              "flex h-14 items-center justify-between border-b px-4",
              dark ? "border-white/10" : "border-border",
            )}
          >
            <LogoMark dark={dark} />
            <Link href="/login" className={cn(linkClass, "text-xs")}>
              Sign in
            </Link>
          </div>
          <nav
            className={cn(
              "flex items-center justify-center gap-0.5 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              dark ? "border-white/10" : "border-border",
            )}
          >
            {LINKS.map(({ href, label }) => (
              <a key={label} href={href} className={linkClass}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile sticky bottom CTA */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t p-3 lg:hidden",
          dark
            ? "border-white/10 bg-[#0a0a0f]"
            : "border-border bg-background/90 backdrop-blur-md",
        )}
      >
        <Link
          href="/start"
          className="mx-auto flex h-12 max-w-lg items-center justify-center gap-2 rounded-full bg-mint text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90"
        >
          Start your project <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  )
}
