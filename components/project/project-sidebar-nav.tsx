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
import { useProject } from "./project-context"

const NAV = [
  {
    href: "",
    label: "Overview",
    step: null,
    icon: LayoutGrid,
    match: /\/projects\/[^/]+$/,
  },
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

export function ProjectSidebarNav() {
  const pathname = usePathname()
  const { bundle } = useProject()
  const base = `/projects/${bundle.project.id}`

  function isActive(match: RegExp) {
    return match.test(pathname)
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="border-b border-border p-4">
        <p className="truncate text-sm font-semibold">{bundle.project.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Your journey
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
  )
}
