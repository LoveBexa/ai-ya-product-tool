"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  updateFeaturePriority,
  updateFeatureText,
} from "@/app/actions/projects"
import type { Feature, FeaturePriority, Requirements } from "@/lib/types"

const COLUMNS: {
  key: FeaturePriority
  label: string
  chip: string
  columnBg: string
  moveBorder: string
  ring: string
}[] = [
  {
    key: "must",
    label: "Must exist",
    chip: "bg-mint text-mint-foreground",
    columnBg: "bg-mint/25",
    moveBorder: "border-mint/55",
    ring: "ring-mint/50",
  },
  {
    key: "nice",
    label: "Later",
    chip: "bg-yellow text-yellow-foreground",
    columnBg: "bg-yellow/25",
    moveBorder: "border-yellow/60",
    ring: "ring-yellow/50",
  },
  {
    key: "ignore",
    label: "Ignore",
    chip: "bg-lilac text-lilac-foreground",
    columnBg: "bg-lilac/25",
    moveBorder: "border-lilac/55",
    ring: "ring-lilac/50",
  },
]

function FeatureDetailPanel({
  feature,
  onClose,
  onMove,
  onSave,
}: {
  feature: Feature
  onClose: () => void
  onMove: (priority: FeaturePriority) => void
  onSave: (fields: { name?: string; reasoning?: string }) => void
}) {
  const [name, setName] = useState(feature.name)
  const [reasoning, setReasoning] = useState(feature.reasoning)

  useEffect(() => {
    setName(feature.name)
    setReasoning(feature.reasoning)
  }, [feature.id, feature.name, feature.reasoning])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close feature details"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:max-w-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <h2 className="text-base font-semibold leading-snug">Feature details</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => onSave({ name: name.trim() || feature.name })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              onBlur={() => onSave({ reasoning })}
              rows={6}
              className="mt-1 min-h-[8rem] resize-none text-sm leading-relaxed"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Move to</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLUMNS.filter((c) => c.key !== feature.priority).map((c) => (
                <Button
                  key={c.key}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn("rounded-full", c.moveBorder)}
                  onClick={() => onMove(c.key)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [detailId, setDetailId] = useState<string | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detailFeature = features.find((f) => f.id === detailId) ?? null

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

  const handoff =
    requirements?.problem ??
    "Discovery complete — prioritise what belongs in version one."

  return (
    <div className="mx-auto w-full max-w-6xl">
      <details className="rounded-xl border border-border bg-card/60">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-foreground">
          Discovery summary
        </summary>
        <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {handoff}
        </p>
      </details>

      <p className="mt-3 text-xs text-muted-foreground">
        Keep MVPs under 5 features — drag cards or open for details.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = features.filter((f) => f.priority === col.key)
          const isDropTarget = dropColumn === col.key && dragId !== null

          return (
            <div
              key={col.key}
              className={cn(
                "flex min-h-0 flex-col rounded-xl p-2.5 sm:p-3",
                col.columnBg,
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    col.chip,
                  )}
                >
                  {col.label}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div
                className={cn(
                  "flex min-h-[4rem] flex-1 flex-col gap-1.5",
                  isDropTarget && cn("rounded-lg ring-2", col.ring),
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
                  <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                    Drop here
                  </p>
                )}

                {items.map((feature) => {
                  const isFlashing =
                    flash?.id === feature.id && flash.priority === col.key

                  return (
                    <article
                      key={feature.id}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border border-border/50 bg-white py-1 pl-1 pr-2 transition-none",
                        dragId === feature.id && !isFlashing && "opacity-50",
                        isFlashing && "define-card-flash",
                      )}
                    >
                      <span
                        draggable
                        onDragStart={() => setDragId(feature.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setDropColumn(null)
                        }}
                        className="cursor-grab shrink-0 p-1 text-muted-foreground active:cursor-grabbing"
                        aria-label={`Drag ${feature.name}`}
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailId(feature.id)}
                        className="min-w-0 flex-1 truncate py-1 text-left text-sm font-medium leading-snug hover:underline"
                      >
                        {feature.name}
                      </button>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {detailFeature && (
        <FeatureDetailPanel
          feature={detailFeature}
          onClose={() => setDetailId(null)}
          onMove={(priority) => {
            move(detailFeature, priority)
            setDetailId(null)
          }}
          onSave={(fields) => saveText(detailFeature, fields)}
        />
      )}
    </div>
  )
}
