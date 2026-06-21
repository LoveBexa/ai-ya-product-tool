"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  blueprintProgress,
  blueprintProgressLabel,
  resolveProjectEmoji,
  relativeLastEdited,
} from "@/lib/home/project-card-meta"
import { projectContinueHref } from "@/lib/journey/onboarding"
import { DeleteProjectTrigger } from "@/components/project/delete-project-trigger"
import type { Project } from "@/lib/types"

export function ProjectListCard({ project }: { project: Project }) {
  const progress = blueprintProgress(project)
  const progressLabel = blueprintProgressLabel(progress)
  const inDiscovery = project.stage === "discovery"

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.15)] transition-shadow hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">
              <span aria-hidden className="mr-1.5">
                {resolveProjectEmoji(project)}
              </span>
              {project.title}
            </p>
            {inDiscovery && (
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Discovery
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {relativeLastEdited(project.created_at)}
          </p>
          <p className="mt-2 text-xs font-medium text-foreground/80">
            {progressLabel}: {progress}%
          </p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-mint/50 bg-gray-200">
            <div
              className="h-full rounded-full bg-mint transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {inDiscovery && (
            <DeleteProjectTrigger
              projectId={project.id}
              projectTitle={project.title}
              variant="compact"
            />
          )}
          <Link
            href={projectContinueHref(project)}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-full bg-mint px-3.5 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90",
            )}
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  )
}
