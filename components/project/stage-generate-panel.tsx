"use client"

import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { projectPath, STOP_LABEL, type JourneyStop } from "@/lib/journey/navigation"
import type { PipelineStageId } from "@/lib/journey/navigation"
import { StageHeader } from "./stage-header"

export function StageGeneratePanel({
  stage,
  title,
  description,
  actionLabel,
  generatingLabel,
  generating,
  error,
  goBackTo,
  projectId,
  onAction,
}: {
  stage: PipelineStageId
  title: string
  description: string
  actionLabel: string
  generatingLabel: string
  generating: boolean
  error: string | null
  goBackTo: JourneyStop | null
  projectId: string
  onAction: () => void
}) {
  return (
    <div className="w-full">
      <StageHeader stage={stage} />
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>

        {error && (
          <p className="mx-auto mt-4 max-w-md text-sm text-warning">{error}</p>
        )}

        <div className="mt-8 flex justify-center">
          {goBackTo ? (
            <Link
              href={projectPath(projectId, goBackTo)}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full border border-border bg-card px-8 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to {STOP_LABEL[goBackTo]}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              disabled={generating}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-mint px-8 text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generatingLabel}
                </>
              ) : (
                actionLabel
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function StageIncompleteBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-yellow/40 bg-yellow/15 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium text-foreground">Not finished yet</p>
      <p className="mt-0.5 text-muted-foreground">{message}</p>
    </div>
  )
}
