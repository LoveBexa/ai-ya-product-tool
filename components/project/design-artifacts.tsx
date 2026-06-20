"use client"

import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WireframeZone } from "@/lib/types/design"

const ZONE_STYLES: Record<WireframeZone["variant"], string> = {
  header: "h-6 w-full rounded bg-muted-foreground/20",
  hero: "h-14 w-full rounded bg-muted-foreground/15",
  search: "h-8 w-full rounded-full bg-muted-foreground/20",
  list: "h-10 w-full rounded bg-muted-foreground/10",
  card: "h-12 w-full rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30",
  form: "h-16 w-full rounded bg-muted-foreground/10",
  footer: "h-5 w-full rounded bg-muted-foreground/15",
}

export function WireframePreview({
  title,
  zones,
  compact = false,
}: {
  title: string
  zones: WireframeZone[]
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3",
        compact && "p-2",
      )}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5 rounded-xl border border-dashed border-muted-foreground/20 bg-secondary/40 p-2">
        {zones.map((zone) => (
          <div key={zone.label} className="space-y-0.5">
            <div className={ZONE_STYLES[zone.variant]} />
            <p className="text-[10px] text-muted-foreground">{zone.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FlowChain({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null

  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex min-w-min items-center gap-1.5 sm:gap-2">
        {steps.map((step, i) => (
          <li key={`${step}-${i}`} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "rounded-xl border border-border/80 bg-secondary/90 px-3 py-2 text-center shadow-sm sm:px-3.5 sm:py-2.5",
                i === 0 && "border-mint/30 bg-secondary",
                i === steps.length - 1 && steps.length > 1 && "border-yellow/30",
              )}
            >
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-lg bg-background/80 px-1 text-[10px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              <p className="mt-1 max-w-[7rem] text-xs font-medium leading-snug text-foreground sm:max-w-[8.5rem] sm:text-sm">
                {step}
              </p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 sm:h-4 sm:w-4"
                aria-hidden
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
