import type { Requirements } from "@/lib/types"

export function DiscoveryLearnings({
  requirements,
}: {
  requirements: Requirements | null
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold tracking-tight">
        Discovery <span className="serif-accent">outputs</span>
      </h3>
      <dl className="mt-4 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
