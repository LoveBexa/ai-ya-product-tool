"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, LayoutGrid, MessageCircle, PenTool, Palette, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import { getJourneySteps, type StepState } from "@/lib/journey/status"
import { useProject } from "./project-context"
import { ProjectSwitcher } from "./project-switcher"

const NAV = [
  {
    href: "",
    label: "Overview",
    step: null as string | null,
    journeyKey: null as null,
    icon: LayoutGrid,
    match: /\/projects\/[^/]+$/,
  },
  {
    href: "/discover",
    label: "Discover",
    step: "1",
    journeyKey: "discover" as const,
    icon: MessageCircle,
    match: /\/discover/,
  },
  {
    href: "/define",
    label: "Features",
    step: "2",
    journeyKey: "define" as const,
    icon: PenTool,
    match: /\/define|\/decide/,
  },
  {
    href: "/design",
    label: "Plan",
    step: "3",
    journeyKey: "design" as const,
    icon: Palette,
    match: /\/design/,
  },
  {
    href: "/execute",
    label: "Blueprint",
    step: "4",
    journeyKey: "execute" as const,
    icon: ListChecks,
    match: /\/execute|\/build/,
  },
] as const

function NavStepBadge({
  step,
  active,
  state,
}: {
  step: string
  active: boolean
  state: StepState | null
}) {
  const done = state === "done"
  const showCheck = done && !active

  if (active) {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-mint/50 bg-mint/10 ring-1 ring-mint/25"
        />
        <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-mint text-mint-foreground">
          {done ? (
            <Check className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <span className="text-[9px] font-bold">{step}</span>
          )}
        </span>
      </span>
    )
  }

  if (showCheck) {
    return (
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-mint-foreground nav-step-done-in",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    )
  }

  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        state === "current"
          ? "bg-mint/25 text-mint-foreground ring-1 ring-mint/40"
          : "bg-secondary text-muted-foreground",
      )}
    >
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
  const { bundle, projects } = useProject()
  const journey = getJourneySteps(bundle)
  const base = `/projects/${bundle.project.id}`

  function isActive(match: RegExp) {
    return match.test(pathname)
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="border-b border-border p-4">
        <ProjectSwitcher projects={projects} current={bundle.project} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ href, label, step, journeyKey, icon: Icon, match }) => {
          const active = isActive(match)
          const state = journeyKey ? journey[journeyKey] : null

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
                <NavStepBadge step={step} active={active} state={state} />
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
