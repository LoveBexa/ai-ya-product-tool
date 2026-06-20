"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  MessageCircle,
  PenTool,
  Palette,
  ListChecks,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand-mark"
import { ProjectBottomBar } from "./project-bottom-bar"
import { PhaseNav } from "./phase-nav"
import { useProject } from "./project-context"

const NAV = [
  { href: "", label: "Overview", step: null, icon: LayoutGrid, match: /\/projects\/[^/]+$/ },
  {
    href: "/discover",
    label: "Discover",
    step: "1",
    icon: MessageCircle,
    match: /\/discover/,
  },
  {
    href: "/define",
    label: "Define",
    step: "2",
    icon: PenTool,
    match: /\/define|\/decide/,
  },
  {
    href: "/design",
    label: "Design",
    step: "3",
    icon: Palette,
    match: /\/design/,
  },
  {
    href: "/execute",
    label: "Blueprint",
    step: "4",
    icon: ListChecks,
    match: /\/execute|\/build/,
  },
] as const

function NavStepBadge({ step, active }: { step: string; active: boolean }) {
  if (active) {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-mint/50 bg-mint/10 ring-1 ring-mint/25"
        />
        <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-mint text-[9px] font-bold text-mint-foreground">
          {step}
        </span>
      </span>
    )
  }

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
      {step}
    </span>
  )
}

function NavIconBadge({
  icon: Icon,
  active,
}: {
  icon: typeof LayoutGrid
  active: boolean
}) {
  if (active) {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-mint/50 bg-mint/10 ring-1 ring-mint/25"
        />
        <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-mint text-mint-foreground">
          <Icon className="h-3 w-3" />
        </span>
      </span>
    )
  }

  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
}

export function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { bundle } = useProject()
  const base = `/projects/${bundle.project.id}`
  const lockViewport = /\/discover(?:\/|$)/.test(pathname)

  function isActive(match: RegExp) {
    return match.test(pathname)
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        lockViewport && "lg:h-dvh lg:overflow-hidden",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col lg:flex-row",
          lockViewport && "lg:overflow-hidden",
        )}
      >
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card/40 lg:flex lg:flex-col">
          <div className="border-b border-border p-4">
            <BrandMark href="/start" showTagline={false} />
            <p className="mt-3 truncate text-sm font-semibold text-muted-foreground">
              {bundle.project.title}
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {NAV.map(({ href, label, step, icon: Icon, match }) => {
              const active = isActive(match)

              return (
              <Link
                key={href || "overview"}
                href={`${base}${href}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {step ? (
                  <NavStepBadge step={step} active={active} />
                ) : (
                  <NavIconBadge icon={Icon} active={active} />
                )}
                {label}
              </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 lg:hidden">
            <BrandMark href="/start" showTagline={false} compact />
            <p className="min-w-0 flex-1 truncate px-3 text-center text-sm font-semibold">
              {bundle.project.title}
            </p>
            <div className="w-[4.5rem] shrink-0" aria-hidden />
          </div>

          <main
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-6",
              lockViewport && "overflow-hidden lg:pb-6",
            )}
          >
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                lockViewport && "overflow-hidden",
              )}
            >
              {children}
            </div>
            <PhaseNav projectId={bundle.project.id} />
          </main>
        </div>
      </div>

      <ProjectBottomBar projectId={bundle.project.id} />
    </div>
  )
}
