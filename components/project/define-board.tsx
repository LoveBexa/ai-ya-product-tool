"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  updateFeaturePriority,
  updateFeatureText,
} from "@/app/actions/projects"
import type { Feature, FeaturePriority, Requirements } from "@/lib/types"
import { StageHeader } from "./stage-header"

const COLUMNS: {
  key: FeaturePriority
  label: string
  hint: string
  chip: string
  columnBg: string
  moveBorder: string
  ring: string
}[] = [
  {
    key: "must",
    label: "Must exist",
    hint: "What must exist in your Minimal Viable Product (MVP)?",
    chip: "bg-mint text-mint-foreground",
    columnBg: "bg-mint/25",
    moveBorder: "border-mint/55",
    ring: "ring-mint/50",
  },
  {
    key: "nice",
    label: "Later",
    hint: "What can wait until after launch?",
    chip: "bg-yellow text-yellow-foreground",
    columnBg: "bg-yellow/25",
    moveBorder: "border-yellow/60",
    ring: "ring-yellow/50",
  },
  {
    key: "ignore",
    label: "Ignore",
    hint: "What is unnecessary for now?",
    chip: "bg-lilac text-lilac-foreground",
    columnBg: "bg-lilac/25",
    moveBorder: "border-lilac/55",
    ring: "ring-lilac/50",
  },
]

export function DefineBoard({
  projectId,
  features,
  requirements,
  onChange,
}: {
  projectId: string
  features: Feature[]
  requirements?: Requirements | null
  onChange: (f: Feature[]) => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropColumn, setDropColumn] = useState<FeaturePriority | null>(null)
  const [flash, setFlash] = useState<{
    id: string
    priority: FeaturePriority
  } | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  function triggerFlash(featureId: string, priority: FeaturePriority) {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    setFlash({ id: featureId, priority })
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 1150)
  }

  function move(feature: Feature, priority: FeaturePriority) {
    if (feature.priority === priority) return
    onChange(
      features.map((f) => (f.id === feature.id ? { ...f, priority } : f)),
    )
    triggerFlash(feature.id, priority)
    updateFeaturePriority(feature.id, projectId, priority).catch(() => {})
  }

  function patchFeature(id: string, patch: Partial<Pick<Feature, "name" | "reasoning">>) {
    onChange(features.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  async function saveText(
    feature: Feature,
    fields: { name?: string; reasoning?: string },
  ) {
    patchFeature(feature.id, fields)
    await updateFeatureText(feature.id, projectId, fields).catch(() => {})
  }

  function handleDrop(column: FeaturePriority) {
    if (!dragId) return
    const feature = features.find((f) => f.id === dragId)
    if (feature) move(feature, column)
    setDragId(null)
    setDropColumn(null)
  }

  const mustCount = features.filter((f) => f.priority === "must").length
  const laterCount = features.filter((f) => f.priority === "nice").length
  const ignoreCount = features.filter((f) => f.priority === "ignore").length

  const handoff =
    requirements?.problem ??
    "Discovery complete — prioritise what belongs in version one."

  return (
    <div className="w-full">
      <StageHeader stage="define" handoffSummary={handoff} />

      <div className="mb-5 -mt-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {mustCount} must exist · {laterCount} later · {ignoreCount} ignore
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Drag tiles between columns or use the move buttons. Click text to edit.
        </p>
        <p className="mt-3 rounded-xl border border-mint/40 bg-mint/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> Best practice
          — keep{" "}
          <span className="font-medium text-foreground">5 features max</span> in your{" "}
          <span className="font-medium text-foreground">
            Minimal Viable Product (MVP)
          </span>
          .
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = features.filter((f) => f.priority === col.key)
          const isDropTarget = dropColumn === col.key && dragId !== null

          return (
            <div
              key={col.key}
              className={cn(
                "flex min-h-0 flex-col rounded-2xl p-3 sm:p-4",
                col.columnBg,
              )}
            >
              <div className="mb-3 px-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                      col.chip,
                    )}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{col.hint}</p>
              </div>

              <div
                className={cn(
                  "flex min-h-[240px] flex-1 flex-col gap-2 sm:min-h-[280px]",
                  isDropTarget && cn("rounded-xl ring-2", col.ring),
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropColumn(col.key)
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  setDropColumn((current) => (current === col.key ? null : current))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(col.key)
                }}
              >
                {items.length === 0 && (
                  <p className="flex flex-1 items-center justify-center px-2 py-8 text-center text-xs text-muted-foreground">
                    Drop features here
                  </p>
                )}

                {items.map((feature) => {
                  const isFlashing =
                    flash?.id === feature.id && flash.priority === col.key

                  return (
                  <article
                    key={feature.id}
                    draggable
                    onDragStart={() => setDragId(feature.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setDropColumn(null)
                    }}
                    className={cn(
                      "relative rounded-xl border border-border/40 bg-white p-2.5 transition-none",
                      dragId === feature.id && !isFlashing && "opacity-50",
                      isFlashing && "define-card-flash",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                        aria-hidden
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={feature.name}
                          onChange={(e) =>
                            patchFeature(feature.id, { name: e.target.value })
                          }
                          onBlur={(e) =>
                            saveText(feature, { name: e.target.value })
                          }
                          className="h-auto rounded-xl border border-border/40 bg-white px-2 py-1.5 text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
                          aria-label="Feature name"
                        />
                        <Textarea
                          value={feature.reasoning}
                          onChange={(e) =>
                            patchFeature(feature.id, { reasoning: e.target.value })
                          }
                          onBlur={(e) =>
                            saveText(feature, { reasoning: e.target.value })
                          }
                          rows={2}
                          className="min-h-[2.75rem] resize-none rounded-xl border border-border/40 bg-white px-2 py-1.5 text-xs leading-relaxed text-muted-foreground shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
                          aria-label="Feature reasoning"
                        />

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => move(feature, c.key)}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-foreground/75 transition-colors hover:text-foreground",
                                c.columnBg,
                                c.moveBorder,
                              )}
                            >
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
