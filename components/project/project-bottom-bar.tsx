"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
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

function BottomBarAccountMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("Your name")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("aiya-user-name")
    if (saved?.trim()) setName(saved.trim())
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const initial = name.charAt(0).toUpperCase() || "?"

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="flex w-full items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
          {initial}
        </span>
        <div className="min-w-0 flex-1 hidden lg:block">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">Account</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 min-w-[9rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg lg:left-auto lg:right-0"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectBottomBar({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const { bundle } = useProject()
  const journey = getJourneySteps(bundle)

  return (
    <footer className="sticky bottom-0 z-30 w-full border-t border-border">
      <div className="flex w-full items-stretch">
        <div className="flex w-14 shrink-0 items-center border-r border-border bg-card/40 px-2 py-3 lg:w-56 lg:px-4">
          <BottomBarAccountMenu />
        </div>

        <div className="min-w-0 flex-1 bg-secondary/70 px-3 py-2.5 sm:px-5 sm:py-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Your journey
          </p>
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

              return (
                <div
                  key={id}
                  className="flex min-w-0 flex-1 items-start last:flex-none"
                >
                  <Link
                    href={href}
                    role="listitem"
                    aria-current={viewing ? "step" : undefined}
                    className="group flex min-w-[3.25rem] flex-col items-center gap-1.5 sm:min-w-0"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                        viewing &&
                          "border-primary bg-primary text-primary-foreground",
                        !viewing &&
                          state === "done" &&
                          "border-mint bg-mint text-mint-foreground",
                        !viewing &&
                          state === "current" &&
                          "border-mint bg-mint/20 text-mint-foreground ring-2 ring-mint/30",
                        !viewing &&
                          state === "upcoming" &&
                          "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {viewing || state === "done" ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:max-w-none sm:text-xs",
                        state === "current" && "text-foreground",
                        state === "done" && "text-mint-foreground",
                        state === "upcoming" && "text-muted-foreground",
                        viewing && "underline decoration-mint/50 underline-offset-2",
                      )}
                    >
                      {label}
                    </span>
                  </Link>

                  {index < PIPELINE_STOPS.length - 1 && (
                    <div
                      className="mx-1 mt-3.5 h-0.5 min-w-[1rem] flex-1 shrink-0"
                      aria-hidden
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          state === "done" ? "bg-mint" : "bg-border",
                        )}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
