"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { generateAndSaveDesign } from "@/app/actions/projects"
import { formatAiError } from "@/lib/ai/errors"
import {
  projectPath,
  STOP_LABEL,
  type JourneyStop,
} from "@/lib/journey/navigation"
import { useProject } from "./project-context"
import { DisclosureSection } from "./disclosure-section"
import { FlowChain } from "./design-artifacts"
import { StageHeader } from "./stage-header"
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
  const mustCount = features.filter((f) => f.priority === "must").length
  const editable = Boolean(onScreenPurposeChange)

  return (
    <div className="w-full">
      <StageHeader
        stage="design"
        handoffSummary={`${mustCount} MVP decisions — mapped to flows and screens.`}
      />

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
    </div>
  )
}

function designPrerequisiteStop(
  requirements: unknown,
  features: { priority: string }[],
): JourneyStop | null {
  if (!requirements) return "discover"
  if (!features.some((f) => f.priority === "must")) return "define"
  return null
}

export function DesignPlaceholder() {
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goBackTo, setGoBackTo] = useState<JourneyStop | null>(null)

  async function handleCreateDesignFlows() {
    const missing = designPrerequisiteStop(bundle.requirements, bundle.features)
    if (missing) {
      setError(
        missing === "discover"
          ? "Finish Discover first — generate requirements before creating design flows."
          : "Add at least one Must Have feature on Define before creating design flows.",
      )
      setGoBackTo(missing)
      return
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
    } catch (e) {
      setError(formatAiError(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="w-full">
      <StageHeader stage="design" />
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12">
        <p className="text-sm font-medium">Preparing your design</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Flows and a screen inventory from your must-haves will appear here.
        </p>

        {error && (
          <p className="mx-auto mt-4 max-w-md text-sm text-warning">{error}</p>
        )}

        <div className="mt-8 flex justify-center">
          {goBackTo ? (
            <Link
              href={projectPath(projectId, goBackTo)}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full border border-border bg-card px-8 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to {STOP_LABEL[goBackTo]}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleCreateDesignFlows}
              disabled={generating}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-mint px-8 text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating flows…
                </>
              ) : (
                "Create design flows"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
