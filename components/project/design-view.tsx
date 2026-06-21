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
import { DefineTraceBadge, FlowTraceBadge } from "./design-trace-badges"
import { SchemaBlueprintPanel } from "./schema-blueprint-panel"
import { Textarea } from "@/components/ui/textarea"
import type { ProductDesign } from "@/lib/types/design"
import type { Feature } from "@/lib/types"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"
import { featureNames, flowRefsForScreen, type ScreenFlowRef } from "@/lib/pipeline/trace"

function ArtifactMeta({ features, featureIds }: { features: Feature[]; featureIds: string[] }) {
  const names = featureNames(features, featureIds)
  if (names.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {names.map((name) => (
        <DefineTraceBadge key={name} featureName={name} />
      ))}
    </div>
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

  useEffect(() => {
    setPurpose(screen.purpose)
  }, [screen.purpose])

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-semibold">{screen.name}</p>
      {flowRefs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {flowRefs.map((ref) => (
            <FlowTraceBadge key={`${ref.step}-${ref.label}`} step={ref.step} label={ref.label} />
          ))}
        </div>
      )}
      {editable && onPurposeChange ? (
        <Textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          onBlur={() => {
            if (purpose !== screen.purpose) onPurposeChange(purpose)
          }}
          rows={2}
          className="mt-2 min-h-0 rounded-xl px-2.5 py-2 text-xs leading-relaxed"
          aria-label={`Purpose for ${screen.name}`}
        />
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {screen.purpose}
        </p>
      )}
      <ArtifactMeta features={features} featureIds={screen.feature_ids} />
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
            Re-generate design flows
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-alert-text">
            This will replace your current user flows, screen inventory, and
            schema blueprint with a fresh version based on your Define must-haves
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
          subtitle={`${design.screens.length} screens — grouped by user flow above`}
          accentClass="bg-yellow text-yellow-foreground"
          defaultOpen
        >
          {editable && (
            <p className="mb-2 text-xs text-muted-foreground">
              Each screen shows which user-flow step it belongs to. Edit the
              explanation text — titles stay fixed for now.
            </p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
      title="Preparing your design"
      description="Flows and a screen inventory from your must-haves will appear here."
      actionLabel="Create design flows"
      generatingLabel="Creating flows…"
      generating={generating}
      error={error}
      goBackTo={goBackTo}
      projectId={projectId}
      onAction={handleCreateDesignFlows}
    />
  )
}
