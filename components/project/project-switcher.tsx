"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveProjectEmoji } from "@/lib/home/project-card-meta"
import type { Project } from "@/lib/types"

export function ProjectSwitcher({
  projects,
  current,
}: {
  projects: Project[]
  current: Project
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  function hrefFor(projectId: string) {
    const suffix = pathname.replace(`/projects/${current.id}`, "") || ""
    return `/projects/${projectId}${suffix}`
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-secondary/80"
      >
        <span className="shrink-0 text-lg leading-none" aria-hidden>
          {resolveProjectEmoji(current)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {current.title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Switch project"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {projects.map((p) => {
            const active = p.id === current.id
            return (
              <Link
                key={p.id}
                href={hrefFor(p.id)}
                role="option"
                aria-selected={active}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  active && "bg-secondary/80 font-medium",
                )}
              >
                <span className="shrink-0 text-base" aria-hidden>
                  {resolveProjectEmoji(p)}
                </span>
                <span className="min-w-0 truncate">{p.title}</span>
              </Link>
            )
          })}
          <div className="my-1 border-t border-border" />
          <Link
            href="/start"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4 shrink-0" />
            New project
          </Link>
        </div>
      )}
    </div>
  )
}
