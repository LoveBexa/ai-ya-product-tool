import { cn } from "@/lib/utils"
import type { ProjectStage } from "@/lib/types"

const LABELS: Record<ProjectStage, string> = {
  discovery: "Discovery",
  requirements: "Requirements",
  mvp: "MVP cut",
  tasks: "Task board",
}

export function StageBadge({
  stage,
  className,
}: {
  stage: ProjectStage
  className?: string
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground",
        stage === "tasks" && "border-primary/40 text-foreground",
        className,
      )}
    >
      {LABELS[stage]}
    </span>
  )
}
