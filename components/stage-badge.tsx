import { cn } from "@/lib/utils"
import type { ProjectStage } from "@/lib/types"

const STAGES: Record<ProjectStage, { label: string; className: string }> = {
  discovery: { label: "Discovery", className: "bg-lilac text-lilac-foreground" },
  requirements: {
    label: "Requirements",
    className: "bg-yellow text-yellow-foreground",
  },
  mvp: { label: "MVP cut", className: "bg-leaf text-leaf-foreground" },
  tasks: { label: "Task board", className: "bg-mint text-mint-foreground" },
}

export function StageBadge({
  stage,
  className,
}: {
  stage: ProjectStage
  className?: string
}) {
  const s = STAGES[stage]
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
