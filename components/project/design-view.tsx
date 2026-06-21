"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { generateAndSaveDesign } from "@/app/actions/projects"
import { formatAiError } from "@/lib/ai/errors"
import { getDesignGenerateBlocker } from "@/lib/journey/prerequisites"
import type { JourneyStop } from "@/lib/journey/navigation"
import { useProject } from "./project-context"
import { StageGeneratePanel } from "./stage-generate-panel"
import { DisclosureSection } from "./disclosure-section"
import { FlowChain } from "./design-artifacts"
import { SchemaBlueprintPanel } from "./schema-blueprint-panel"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ProductDesign } from "@/lib/types/design"
import type { Feature } from "@/lib/types"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"
import {
  featureNames,
  flowRefsForScreen,
  formatScreenFlowLine,
  type ScreenFlowRef,
} from "@/lib/pipeline/trace"

function ScreenMetaRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "lilac" | "mint"
}) {
  return (
    <p className="text-[11px] leading-relaxed sm:text-xs">
      <span
        className={cn(
          "font-bold uppercase tracking-wider",
          tone === "lilac" ? "text-lilac-foreground" : "text-mint-foreground",
        )}
      >
        {label}{" "}
      </span>
      <span className="font-medium text-foreground/90">{value}</span>
    </p>
  )
}

function ScreenCard({
  screen,
  features,
  flowRefs,
  editable,
  onPurposeChange,
}: {
  screen: ProductDesign["screens"][number]
  features: Feature[]
  flowRefs: ScreenFlowRef[]
  editable: boolean
  onPurposeChange?: (purpose: string) => void
}) {
  const [purpose, setPurpose] = useState(screen.purpose)
  const flowLine = formatScreenFlowLine(flowRefs)
  const linkedFeatures = featureNames(features, screen.feature_ids)
  const featureLabel =
    linkedFeatures.length === 1 ? "Feature:" : "Feature(s):"

  useEffect(() => {
    setPurpose(screen.purpose)
  }, [screen.purpose])

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_4px_22px_-14px_rgba(0,0,0,0.18)] transition-shadow hover:shadow-[0_8px_30px_-14px_rgba(0,0,0,0.22)]">
      <div className="border-b border-border/50 bg-gradient-to-br from-secondary/50 to-secondary/20 px-4 py-3.5">
        <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">
          {screen.name}
        </h3>
      </div>

      {(flowLine || linkedFeatures.length > 0) && (
        <div className="space-y-2.5 border-b border-border/40 bg-background/80 px-4 py-3">
          {flowLine && (
            <ScreenMetaRow label="Flow:" value={flowLine} tone="lilac" />
          )}
          {linkedFeatures.length > 0 && (
            <ScreenMetaRow
              label={featureLabel}
              value={linkedFeatures.join(", ")}
              tone="mint"
            />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col px-4 py-3.5">
        <label
          htmlFor={`screen-purpose-${screen.id}`}
          className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Purpose
        </label>
        {editable && onPurposeChange ? (
          <Textarea
            id={`screen-purpose-${screen.id}`}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            onBlur={() => {
              if (purpose !== screen.purpose) onPurposeChange(purpose)
            }}
            rows={3}
            className="mt-2 min-h-[4.5rem] resize-none rounded-xl border-border/80 bg-secondary/20 px-3 py-2.5 text-xs leading-relaxed sm:text-sm"
            aria-label={`Purpose for ${screen.name}`}
          />
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {screen.purpose}
          </p>
        )}
      </div>
    </li>
  )
}

function useDesignGeneration() {
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goBackTo, setGoBackTo] = useState<JourneyStop | null>(null)

  async function generateDesign() {
    const blocker = getDesignGenerateBlocker(bundle)
    if (blocker) {
      setError(blocker.message)
      setGoBackTo(blocker.stop)
      return false
    }

    setError(null)
    setGoBackTo(null)
    setGenerating(true)
    try {
      const design = await generateAndSaveDesign(projectId)
      setBundle((b) => ({
        ...b,
        design,
        project: { ...b.project, product_design: design },
      }))
      return true
    } catch (e) {
      setError(formatAiError(e))
      return false
    } finally {
      setGenerating(false)
    }
  }

  return { generating, error, goBackTo, generateDesign, projectId }
}

function RegenerateDesignSection() {
  const { generating, error, generateDesign } = useDesignGeneration()
  const [confirming, setConfirming] = useState(false)

  async function handleRegenerate() {
    const ok = await generateDesign()
    if (ok) setConfirming(false)
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
      {!confirming ? (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Flows and screens already generated from your must-haves.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Re-generate plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-alert-text">
            This will replace your current user flows, screen inventory, and
            schema blueprint with a fresh version based on your must-have features
            and Discover requirements. Edits to screen purposes will be lost.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={generating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-mint px-5 text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-generating…
                </>
              ) : (
                "Yes, re-generate"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={generating}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-alert-text">{error}</p>}
    </section>
  )
}

export function DesignView({
  design,
  features,
  schemaBlueprint,
  onScreenPurposeChange,
}: {
  design: ProductDesign
  features: Feature[]
  schemaBlueprint: SchemaBlueprint
  onScreenPurposeChange?: (screenId: string, purpose: string) => void
}) {
  const editable = Boolean(onScreenPurposeChange)

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        <DisclosureSection
          title="User flows"
          subtitle="What someone does from first visit to happy customer"
          accentClass="bg-mint text-mint-foreground"
          defaultOpen
        >
          <FlowChain steps={design.user_flow.map((s) => s.label)} />
        </DisclosureSection>

        <DisclosureSection
          title="Screen inventory"
          subtitle={`${design.screens.length} screens linked to flows and features`}
          accentClass="bg-yellow text-yellow-foreground"
          defaultOpen
        >
          {editable && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Each card shows which flow steps and features it supports. Edit the
              purpose text below the metadata.
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {design.screens.map((screen) => (
              <ScreenCard
                key={screen.id}
                screen={screen}
                features={features}
                flowRefs={flowRefsForScreen(design, screen)}
                editable={editable}
                onPurposeChange={
                  onScreenPurposeChange
                    ? (purpose) => onScreenPurposeChange(screen.id, purpose)
                    : undefined
                }
              />
            ))}
          </ul>
        </DisclosureSection>

        <DisclosureSection
          title="Schema blueprint"
          subtitle="Potential data model — inferred from flows, screens, and MVP features"
          accentClass="bg-lilac text-lilac-foreground"
          defaultOpen
        >
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            AIYA suggests what tables you&apos;ll likely need based on how people
            move through the app and what each screen does. Use the prompt snippet
            when scaffolding with Cursor, Claude Code, or v0 — it carries into your
            blueprint export.
          </p>
          <SchemaBlueprintPanel blueprint={schemaBlueprint} />
        </DisclosureSection>
      </div>

      <RegenerateDesignSection />
    </div>
  )
}

export function DesignPlaceholder() {
  const { generating, error, goBackTo, generateDesign, projectId } =
    useDesignGeneration()

  async function handleCreateDesignFlows() {
    await generateDesign()
  }

  return (
    <StageGeneratePanel
      title="Preparing your plan"
      description="User flows and a screen inventory from your must-haves will appear here."
      actionLabel="Create plan"
      generatingLabel="Creating plan…"
      generating={generating}
      error={error}
      goBackTo={goBackTo}
      projectId={projectId}
      onAction={handleCreateDesignFlows}
    />
  )
}
