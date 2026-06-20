"use client"

import { useMemo, useState } from "react"
import {
  Download,
  GripVertical,
  Loader2,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StageHeader } from "./stage-header"
import { CardDetail } from "./card-detail"
import {
  generateAndSaveFoundationPrompt,
  updateCardAiPrompt,
  updateFeatureSortOrder,
  updateFeatureVerify,
  updateFoundationPrompt,
} from "@/app/actions/projects"
import {
  assembleBuildPlanMarkdown,
  downloadMarkdown,
} from "@/lib/build-plan/export"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"
import { cn } from "@/lib/utils"
import type { Feature, Requirements, TaskCard } from "@/lib/types"
import type { ProductDesign } from "@/lib/types/design"
import { SchemaBlueprintPanel } from "./schema-blueprint-panel"
import { FlowChain } from "./design-artifacts"

function reorderIds(ids: string[], from: number, to: number): string[] {
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function BuildPlan({
  projectId,
  projectTitle,
  requirements,
  features,
  cards,
  design,
  schemaBlueprint,
  foundationPrompt,
  onFeaturesChange,
  onCardsChange,
  onFoundationChange,
}: {
  projectId: string
  projectTitle: string
  requirements: Requirements | null
  features: Feature[]
  cards: TaskCard[]
  design: ProductDesign | null
  schemaBlueprint: SchemaBlueprint | null
  foundationPrompt: string
  onFeaturesChange: (features: Feature[]) => void
  onCardsChange: (cards: TaskCard[]) => void
  onFoundationChange: (prompt: string) => void
}) {
  const mustFeatures = useMemo(
    () =>
      features
        .filter((f) => f.priority === "must")
        .sort((a, b) => a.sort_order - b.sort_order),
    [features],
  )
  const laterFeatures = useMemo(
    () => features.filter((f) => f.priority === "nice"),
    [features],
  )
  const ignoreFeatures = useMemo(
    () => features.filter((f) => f.priority === "ignore"),
    [features],
  )

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [generatingFoundation, setGeneratingFoundation] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [detailCardId, setDetailCardId] = useState<string | null>(null)

  const detailCard = cards.find((c) => c.id === detailCardId) ?? null
  const detailFeatureName =
    features.find((f) => f.id === detailCard?.feature_id)?.name ?? "Feature"

  const markdown = useMemo(() => {
    if (!requirements) return ""
    return assembleBuildPlanMarkdown({
      projectTitle,
      requirements,
      mustFeatures,
      allFeatures: features,
      design,
      schemaBlueprint,
      foundationPrompt,
      cards,
    })
  }, [projectTitle, requirements, mustFeatures, features, design, schemaBlueprint, foundationPrompt, cards])

  async function persistOrder(nextIds: string[]) {
    const reordered = nextIds.map((id, index) => {
      const feature = mustFeatures.find((f) => f.id === id)!
      return { ...feature, sort_order: index }
    })
    const untouched = features.filter((f) => f.priority !== "must")
    onFeaturesChange(
      [...reordered, ...untouched].sort((a, b) => a.sort_order - b.sort_order),
    )

    try {
      await updateFeatureSortOrder(projectId, nextIds)
    } catch {
      /* keep optimistic order */
    }
  }

  function finishDrag() {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }

    const ids = mustFeatures.map((f) => f.id)
    void persistOrder(reorderIds(ids, dragIndex, overIndex))
    setDragIndex(null)
    setOverIndex(null)
  }

  async function saveFoundation(value: string) {
    onFoundationChange(value)
    await updateFoundationPrompt(projectId, value).catch(() => {})
  }

  async function generateFoundation() {
    setGeneratingFoundation(true)
    try {
      const prompt = await generateAndSaveFoundationPrompt(projectId)
      onFoundationChange(prompt)
    } finally {
      setGeneratingFoundation(false)
    }
  }

  async function saveVerify(feature: Feature, verify: string) {
    onFeaturesChange(
      features.map((f) => (f.id === feature.id ? { ...f, verify } : f)),
    )
    await updateFeatureVerify(feature.id, projectId, verify).catch(() => {})
  }

  async function saveAiPrompt(card: TaskCard, ai_prompt: string) {
    onCardsChange(cards.map((c) => (c.id === card.id ? { ...c, ai_prompt } : c)))
    await updateCardAiPrompt(card.id, projectId, ai_prompt).catch(() => {})
  }

  if (!requirements) {
    return null
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <StageHeader
            stage="execute"
            handoffSummary="Design complete — flows, screens, and schema assembled into your exportable blueprint."
          />
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-full"
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-4 w-4" /> Export blueprint
        </Button>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold">1. Spec Sheet</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Audience", requirements.audience],
              ["Problem", requirements.problem],
              ["Solution", requirements.solution],
              ["Revenue model / goal", requirements.revenue_model],
              ["Success metric", requirements.success_metric],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Must Have features
          </p>
          <ul className="mt-2 space-y-2">
            {mustFeatures.map((feature) => (
              <li
                key={feature.id}
                className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm"
              >
                <span className="font-semibold">{feature.name}</span>
                <span className="text-muted-foreground"> — {feature.reasoning}</span>
              </li>
            ))}
          </ul>
        </div>
        {(laterFeatures.length > 0 || ignoreFeatures.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {laterFeatures.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Later
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {laterFeatures.map((f) => (
                    <li key={f.id}>· {f.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {ignoreFeatures.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ignore
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {ignoreFeatures.map((f) => (
                    <li key={f.id}>· {f.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {design && (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold">2. User flows &amp; screens</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            From Design — how people move through the app and which screens each step uses.
          </p>
          <div className="mt-4">
            <FlowChain steps={design.user_flow.map((s) => s.label)} />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {design.screens.map((screen) => (
              <li
                key={screen.id}
                className="rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm"
              >
                <span className="font-semibold">{screen.name}</span>
                <span className="text-muted-foreground"> — {screen.purpose}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold">{design ? "3. Schema blueprint" : "2. Schema blueprint"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Auto-derived from Design — user flows, screens, and MVP features. This
          is what you prompt your AI builder with before writing feature code.
        </p>
        {schemaBlueprint ? (
          <div className="mt-4">
            <SchemaBlueprintPanel blueprint={schemaBlueprint} compact />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Complete Design first — flows and screens are needed to infer the data
            model.
          </p>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {design ? "4. Foundation step" : "3. Foundation step"}
          </h3>
          {!foundationPrompt.trim() && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generatingFoundation}
              onClick={generateFoundation}
            >
              {generatingFoundation ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate foundation prompt
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste this into Cursor, Claude Code, or v0 before any feature work.
        </p>
        <Textarea
          className="mt-4 min-h-40 font-mono text-xs leading-relaxed"
          value={foundationPrompt}
          onChange={(e) => onFoundationChange(e.target.value)}
          onBlur={(e) => saveFoundation(e.target.value)}
          placeholder="Generate or write the project scaffolding prompt…"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold">
          {design ? "5. Feature steps" : "4. Feature steps"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag to set order in your blueprint. Order is saved to the project.
        </p>

        <ol className="mt-4 space-y-4" onPointerUp={finishDrag} onPointerLeave={finishDrag}>
          {mustFeatures.map((feature, index) => {
            const featureCards = cards
              .filter((c) => c.feature_id === feature.id && c.card_type !== "blueprint")
              .sort((a, b) => a.sort_order - b.sort_order)

            return (
              <li
                key={feature.id}
                className={cn(
                  "rounded-2xl border border-border bg-background p-4 transition-shadow",
                  dragIndex === index && "opacity-60",
                  overIndex === index && dragIndex !== null && "ring-2 ring-mint/40",
                )}
                onPointerEnter={() => {
                  if (dragIndex !== null) setOverIndex(index)
                }}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label={`Reorder ${feature.name}`}
                    className="mt-1 cursor-grab touch-none rounded-xl p-1 text-muted-foreground hover:bg-secondary active:cursor-grabbing"
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      setDragIndex(index)
                      setOverIndex(index)
                    }}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <h4 className="text-base font-semibold">{feature.name}</h4>
                    </div>

                    {featureCards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No feature cards yet — regenerate from Overview if needed.
                      </p>
                    ) : (
                      featureCards.map((card) => (
                        <div key={card.id} className="space-y-3 rounded-xl border border-border/60 bg-secondary/10 p-3">
                          {card.goal && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Goal
                              </p>
                              <p className="mt-1 text-sm">{card.goal}</p>
                            </div>
                          )}
                          {card.how_to_build && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                How to build
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {card.how_to_build}
                              </p>
                            </div>
                          )}
                          {card.screens.length > 0 && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Screens
                              </p>
                              <p className="mt-1 text-sm">{card.screens.join(", ")}</p>
                            </div>
                          )}
                          {card.acceptance_criteria.length > 0 && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Acceptance criteria
                              </p>
                              <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                                {card.acceptance_criteria.map((ac) => (
                                  <li key={ac}>{ac}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Feature prompt
                              {featureCards.length > 1 ? `: ${card.title}` : ""}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setDetailCardId(card.id)}
                            >
                              Full card details
                            </Button>
                          </div>
                          <Textarea
                            className="min-h-32 font-mono text-xs leading-relaxed"
                            value={card.ai_prompt}
                            onChange={(e) =>
                              onCardsChange(
                                cards.map((c) =>
                                  c.id === card.id
                                    ? { ...c, ai_prompt: e.target.value }
                                    : c,
                                ),
                              )
                            }
                            onBlur={(e) => saveAiPrompt(card, e.target.value)}
                          />
                        </div>
                      ))
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Verify
                      </p>
                      <Textarea
                        className="min-h-16 text-sm leading-relaxed"
                        value={feature.verify}
                        onChange={(e) =>
                          onFeaturesChange(
                            features.map((f) =>
                              f.id === feature.id ? { ...f, verify: e.target.value } : f,
                            ),
                          )
                        }
                        onBlur={(e) => saveVerify(feature, e.target.value)}
                        placeholder='e.g. "Visiting /dashboard shows the seeded list; adding an item persists after refresh."'
                      />
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="mb-8 flex justify-end">
        <Button
          type="button"
          className="rounded-full"
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-4 w-4" /> Export blueprint
        </Button>
      </div>

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Close export preview"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setExportOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Export preview</h3>
              <Button size="icon" variant="ghost" onClick={() => setExportOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <pre className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {markdown}
            </pre>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  downloadMarkdown(
                    `${projectTitle.replace(/\s+/g, "-").toLowerCase()}-blueprint.md`,
                    markdown,
                  )
                  setExportOpen(false)
                }}
              >
                <Download className="h-4 w-4" /> Download .md
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailCard && (
        <CardDetail
          card={detailCard}
          featureName={detailFeatureName}
          onClose={() => setDetailCardId(null)}
        />
      )}
    </div>
  )
}