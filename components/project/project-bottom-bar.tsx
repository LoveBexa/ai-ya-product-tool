"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { STAGES, type StageId } from "@/lib/journey/specialists"
import { getJourneySteps } from "@/lib/journey/status"
import { PIPELINE_STOPS, projectPath } from "@/lib/journey/navigation"
import { useProject } from "./project-context"

const PATH_MATCH: Record<StageId, RegExp> = {
  discover: /\/discover/,
  define: /\/define|\/decide/,
  design: /\/design/,
  execute: /\/execute|\/build/,
  evolve: /\/evolve/,
}

export function ProjectBottomBar({
  projectId,
  onboarding = false,
  alwaysVisible = false,
}: {
  projectId: string
  onboarding?: boolean
  alwaysVisible?: boolean
}) {
  const pathname = usePathname()
  const { bundle } = useProject()
  const journey = getJourneySteps(bundle)

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-30 w-full border-t border-border",
        !alwaysVisible && "lg:hidden",
      )}
    >
      <div className="bg-secondary/70 px-3 py-2.5 sm:px-5 sm:py-3">
        {!onboarding && (
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Your journey
          </p>
        )}
        <div
          className="flex items-start gap-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Product journey"
        >
          {PIPELINE_STOPS.map((id, index) => {
            const state = journey[id]
            const viewing = PATH_MATCH[id].test(pathname)
            const label = STAGES[id].label
            const href = projectPath(projectId, id)
            const locked = onboarding && id !== "discover"

            const circle = (
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                  locked && "border-border bg-card/80 text-muted-foreground/50",
                  !locked &&
                    viewing &&
                    "border-primary bg-primary text-primary-foreground",
                  !locked &&
                    !viewing &&
                    state === "done" &&
                    "border-mint bg-mint text-mint-foreground nav-step-done-in",
                  !locked &&
                    !viewing &&
                    state === "current" &&
                    "border-mint bg-mint/20 text-mint-foreground ring-2 ring-mint/30",
                  !locked &&
                    !viewing &&
                    state === "upcoming" &&
                    "border-border bg-card text-muted-foreground",
                )}
              >
                {!locked && (viewing || state === "done") ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
            )

            const labelEl = (
              <span
                className={cn(
                  "max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:max-w-none sm:text-xs",
                  locked && "text-muted-foreground/50",
                  !locked && state === "current" && "text-foreground",
                  !locked && state === "done" && "text-mint-foreground",
                  !locked && state === "upcoming" && "text-muted-foreground",
                  !locked &&
                    viewing &&
                    "underline decoration-mint/50 underline-offset-2",
                )}
              >
                {label}
              </span>
            )

            return (
              <div
                key={id}
                className="flex min-w-0 flex-1 items-start last:flex-none"
              >
                {locked ? (
                  <div
                    role="listitem"
                    aria-disabled
                    className="flex min-w-[3.25rem] flex-col items-center gap-1.5 opacity-60 sm:min-w-0"
                  >
                    {circle}
                    {labelEl}
                  </div>
                ) : (
                  <Link
                    href={href}
                    role="listitem"
                    aria-current={viewing ? "step" : undefined}
                    className="group flex min-w-[3.25rem] flex-col items-center gap-1.5 sm:min-w-0"
                  >
                    {circle}
                    {labelEl}
                  </Link>
                )}

                {index < PIPELINE_STOPS.length - 1 && (
                  <div
                    className="mx-1 mt-3.5 h-0.5 min-w-[1rem] flex-1 shrink-0"
                    aria-hidden
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        !locked && state === "done" ? "bg-mint" : "bg-border",
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
