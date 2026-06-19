"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  updateFeaturePriority,
  generateAndSaveCards,
} from "@/app/actions/projects"
import type { Feature, FeaturePriority, TaskCard } from "@/lib/types"

const COLUMNS: {
  key: FeaturePriority
  label: string
  hint: string
  accent: string
}[] = [
  {
    key: "must",
    label: "Must have",
    hint: "Core to the MVP",
    accent: "border-primary/50",
  },
  {
    key: "nice",
    label: "Nice to have",
    hint: "Valuable, deferrable",
    accent: "border-warning/40",
  },
  {
    key: "ignore",
    label: "Ignore",
    hint: "Out of scope for v1",
    accent: "border-border",
  },
]

export function MvpBoard({
  projectId,
  features,
  onChange,
  onCards,
}: {
  projectId: string
  features: Feature[]
  onChange: (f: Feature[]) => void
  onCards: (c: TaskCard[]) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function move(feature: Feature, priority: FeaturePriority) {
    if (feature.priority === priority) return
    onChange(
      features.map((f) => (f.id === feature.id ? { ...f, priority } : f)),
    )
    updateFeaturePriority(feature.id, projectId, priority).catch(() => {})
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const cards = await generateAndSaveCards(projectId)
      onCards(cards)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.")
    } finally {
      setGenerating(false)
    }
  }

  const mustCount = features.filter((f) => f.priority === "must").length

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">MVP cut</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reassign anything you disagree with. Then build task cards for the
            Must Haves.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-warning">{error}</span>}
          <Button onClick={generate} disabled={generating || mustCount === 0}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building cards…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate task cards
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = features.filter((f) => f.priority === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between px-1">
                <div>
                  <h3 className="text-sm font-medium">{col.label}</h3>
                  <p className="text-xs text-muted-foreground">{col.hint}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div className="flex min-h-24 flex-col gap-2 rounded-xl border border-dashed border-border p-2">
                {items.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                )}
                {items.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "rounded-lg border bg-card p-3",
                      col.accent,
                    )}
                  >
                    <p className="text-sm font-medium leading-snug">{f.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {f.reasoning}
                    </p>
                    <div className="mt-2.5 flex gap-1">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button
                          key={c.key}
                          onClick={() => move(f, c.key)}
                          className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
