"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { generateAndSaveDesign } from "@/app/actions/projects"
import { formatAiError } from "@/lib/ai/errors"
import { useProject } from "./project-context"
import {
  adjacentJourneyStops,
  currentJourneyStop,
  nextStepLabel,
  projectPath,
  STOP_LABEL,
} from "@/lib/journey/navigation"

export function PhaseNav({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { bundle, setBundle } = useProject()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = currentJourneyStop(pathname)
  const { prev, next } = adjacentJourneyStops(current)
  const mustCount = bundle.features.filter((f) => f.priority === "must").length
  const createDesignFlows = current === "define" && next === "design"

  async function handleCreateDesignFlows() {
    if (mustCount === 0) return
    setError(null)
    setGenerating(true)
    try {
      const design = await generateAndSaveDesign(projectId)
      setBundle((b) => ({
        ...b,
        design,
        project: { ...b.project, product_design: design },
      }))
      router.push(projectPath(projectId, "design"))
    } catch (e) {
      setError(formatAiError(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mt-10 shrink-0 border-t border-border pt-6">
      <nav
        aria-label="Phase navigation"
        className="flex items-center justify-between gap-4"
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
          createDesignFlows ? (
            <button
              type="button"
              onClick={handleCreateDesignFlows}
              disabled={generating || mustCount === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating flows…
                </>
              ) : (
                <>
                  {nextStepLabel(current, next)}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <Link
              href={projectPath(projectId, next)}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90"
            >
              {nextStepLabel(current, next)}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground/40">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </nav>
      {error && (
        <p className="mt-2 text-right text-xs text-warning">{error}</p>
      )}
      {createDesignFlows && mustCount === 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          Add at least one Must Have feature first.
        </p>
      )}
    </div>
  )
}
