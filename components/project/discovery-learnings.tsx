import type { Requirements } from "@/lib/types"

export function DiscoveryLearnings({
  requirements,
  compact = false,
}: {
  requirements: Requirements | null
  compact?: boolean
}) {
  const problem = requirements?.problem ?? "Still exploring…"
  const audience = requirements?.audience ?? "Still exploring…"
  const goal = requirements?.success_metric ?? "Still exploring…"
  const assumptions = requirements?.solution ?? "Still exploring…"

  const rows = [
    { label: "Problem", value: problem },
    { label: "Audience", value: audience },
    { label: "Goal", value: goal },
    { label: "Assumptions", value: assumptions },
  ]

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-border bg-card p-3"
          : "rounded-2xl border border-border bg-card p-5"
      }
    >
      <h3 className="text-sm font-semibold tracking-tight">
        Discovery <span className="serif-accent">outputs</span>
      </h3>
      <dl className={compact ? "mt-2 space-y-2" : "mt-4 space-y-3"}>
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-0.5 text-xs leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
