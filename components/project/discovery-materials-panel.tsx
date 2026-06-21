"use client"

import { useMemo, useState } from "react"
import {
  Eye,
  FileText,
  ImageIcon,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  MATERIAL_TABS,
  SAMPLE_MATERIALS,
  type DiscoveryMaterial,
  type MaterialCategory,
} from "@/lib/mock/discovery-materials"

const TAB_ICONS: Record<MaterialCategory, typeof FileText> = {
  chat: MessageSquare,
  sketches: ImageIcon,
  drawings: ImageIcon,
}

export function DiscoveryMaterialsPanel({
  materials: controlledMaterials,
  onMaterialsChange,
  initialMaterials = [],
  compact = false,
}: {
  materials?: DiscoveryMaterial[]
  onMaterialsChange?: (materials: DiscoveryMaterial[]) => void
  initialMaterials?: DiscoveryMaterial[]
  compact?: boolean
}) {
  const [internal, setInternal] = useState<DiscoveryMaterial[]>(
    initialMaterials.length > 0 ? initialMaterials : [],
  )
  const [tab, setTab] = useState<MaterialCategory>("chat")
  const [preview, setPreview] = useState<DiscoveryMaterial | null>(null)

  const materials = controlledMaterials ?? internal
  const setMaterials = onMaterialsChange ?? setInternal

  const filtered = useMemo(
    () => materials.filter((m) => m.category === tab),
    [materials, tab],
  )

  const counts = useMemo(
    () =>
      MATERIAL_TABS.reduce(
        (acc, { id }) => {
          acc[id] = materials.filter((m) => m.category === id).length
          return acc
        },
        {} as Record<MaterialCategory, number>,
      ),
    [materials],
  )

  function remove(id: string) {
    setMaterials(materials.filter((m) => m.id !== id))
    if (preview?.id === id) setPreview(null)
  }

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border bg-card",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">
            Your <span className="serif-accent">materials</span>
          </h3>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {materials.length}
          </span>
        </div>

        <div className="mt-2 flex gap-1 rounded-lg bg-secondary/60 p-0.5">
          {MATERIAL_TABS.map(({ id, label }) => {
            const Icon = TAB_ICONS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors sm:text-[10px]",
                  tab === id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="hidden h-3 w-3 sm:block" />
                {label}
                {counts[id] > 0 && (
                  <span className="rounded-full bg-muted px-1 text-[8px]">
                    {counts[id]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border bg-secondary/30 px-2 py-4 text-center text-[11px] text-muted-foreground">
              No uploads yet — use the chat upload area.
            </li>
          ) : (
            filtered.map((file) => (
              <li
                key={file.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">{file.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {file.kind}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    aria-label={`View ${file.name}`}
                    onClick={() => setPreview(file)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-pink-foreground"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => remove(file.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Close preview"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{preview.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {preview.kind}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setPreview(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50">
              <p className="px-4 text-center text-xs text-muted-foreground">
                File preview coming soon — this is a layout mockup.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function useDiscoveryMaterials(initial = SAMPLE_MATERIALS) {
  const [materials, setMaterials] = useState<DiscoveryMaterial[]>(initial)
  return { materials, setMaterials }
}
