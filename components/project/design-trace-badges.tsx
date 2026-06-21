import type { DesignTrace } from "@/lib/types/design"
import type { ProductDesign } from "@/lib/types/design"
import { traceLabels } from "@/lib/pipeline/trace"

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[10px]">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </span>
  )
}

export function DesignTraceBadges({
  design,
  trace,
}: {
  design: ProductDesign
  trace: DesignTrace
}) {
  const labels = traceLabels(design, trace)
  const items: { label: string; value: string }[] = []

  labels.flows.forEach((v) => items.push({ label: "Flow", value: v }))
  labels.workflows.forEach((v) => items.push({ label: "Workflow", value: v }))
  labels.screens.forEach((v) => items.push({ label: "Screen", value: v }))
  labels.wireframes.forEach((v) => items.push({ label: "Wireframe", value: v }))

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ label, value }) => (
        <Badge key={`${label}-${value}`} label={label} value={value} />
      ))}
    </div>
  )
}

export function FeatureTraceBadge({ featureName }: { featureName: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-mint/40 bg-mint/10 px-2.5 py-0.5 text-[10px] font-medium text-mint-foreground">
      {featureName}
    </span>
  )
}

/** @deprecated Use FeatureTraceBadge */
export const DefineTraceBadge = FeatureTraceBadge

export function FlowTraceBadge({
  step,
  label,
}: {
  step: number
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-lilac/40 bg-lilac/10 px-2 py-0.5 text-[10px] text-lilac-foreground">
      <span className="font-semibold uppercase tracking-wide">Flow:</span>
      <span className="font-medium uppercase">
        {step}. {label}
      </span>
    </span>
  )
}
