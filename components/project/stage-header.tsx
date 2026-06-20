import { ArrowRight } from "lucide-react"
import type { StageId } from "@/lib/journey/specialists"
import { stageMeta } from "@/lib/journey/specialists"

export function StageHeader({
  stage,
  handoffSummary,
}: {
  stage: StageId
  handoffSummary?: string
}) {
  const meta = stageMeta(stage)
  const from = meta.handoffFrom ? stageMeta(meta.handoffFrom) : null

  return (
    <header className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {meta.role}
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">
        {meta.headline.split(" ").slice(0, -1).join(" ")}{" "}
        <span className="serif-accent">{meta.headline.split(" ").slice(-1)}</span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>

      {from && handoffSummary && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">From {from.role}:</span>{" "}
            {handoffSummary}
          </span>
        </div>
      )}
    </header>
  )
}
