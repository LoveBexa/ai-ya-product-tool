"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  adjacentJourneyStops,
  currentJourneyStop,
  projectPath,
  STOP_LABEL,
} from "@/lib/journey/navigation"

export function PhaseNav({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const current = currentJourneyStop(pathname)
  const { prev, next } = adjacentJourneyStops(current)

  return (
    <nav
      aria-label="Phase navigation"
      className="mt-10 flex shrink-0 items-center justify-between gap-4 border-t border-border pt-6"
    >
      {prev ? (
        <Link
          href={projectPath(projectId, prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
          {STOP_LABEL[prev]}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-4 py-2 text-sm text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      {next ? (
        <Link
          href={projectPath(projectId, next)}
          className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90"
        >
          {STOP_LABEL[next]}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground/40">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
