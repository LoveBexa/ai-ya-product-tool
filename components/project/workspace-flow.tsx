"use client"

import { useMemo, useState } from "react"
import { deriveSchemaBlueprint } from "@/lib/design/schema-blueprint"
import { useProject } from "./project-context"
import { DiscoveryChat } from "./discovery-chat"
import { DefineBoard } from "./define-board"
import { DesignView, DesignPlaceholder } from "./design-view"
import { BuildPlan } from "./build-plan"
import type { ProductDesign } from "@/lib/types/design"

export type FlowView = "discover" | "define" | "design" | "execute"

export function WorkspaceFlow({ view }: { view: FlowView }) {
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const requirements = bundle.requirements
  const features = bundle.features

  const [design, setDesign] = useState<ProductDesign | null>(null)

  const mustFeatures = useMemo(
    () => features.filter((f) => f.priority === "must"),
    [features],
  )

  const schemaBlueprint = useMemo(
    () => (design ? deriveSchemaBlueprint(design, mustFeatures) : null),
    [design, mustFeatures],
  )

  if (view === "discover") {
    return (
      <DiscoveryChat
        bundle={bundle}
        onDiscoveryComplete={({ requirements, features }) =>
          setBundle((b) => ({
            ...b,
            requirements,
            features,
            project: { ...b.project, stage: "mvp" },
          }))
        }
      />
    )
  }

  if (view === "define") {
    return (
      <DefineBoard
        projectId={projectId}
        features={features}
        requirements={requirements}
        onChange={(feat) =>
          setBundle((b) => ({
            ...b,
            features: feat,
            project: { ...b.project, stage: "mvp" },
          }))
        }
      />
    )
  }

  if (view === "design") {
    const hasMust = mustFeatures.length > 0
    if (design && schemaBlueprint) {
      return (
        <DesignView
          design={design}
          features={features}
          schemaBlueprint={schemaBlueprint}
          onScreenPurposeChange={(screenId, purpose) =>
            setDesign((d) =>
              d
                ? {
                    ...d,
                    screens: d.screens.map((s) =>
                      s.id === screenId ? { ...s, purpose } : s,
                    ),
                  }
                : d,
            )
          }
        />
      )
    }
    if (hasMust) {
      return <DesignPlaceholder />
    }
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Finish Define first — the UX Designer picks up from your must-haves.
      </div>
    )
  }

  if (view === "execute") {
    return (
      <BuildPlan
        projectId={projectId}
        projectTitle={bundle.project.title}
        requirements={requirements}
        features={features}
        cards={bundle.cards}
        schemaBlueprint={schemaBlueprint}
        foundationPrompt={bundle.project.foundation_prompt ?? ""}
        onFeaturesChange={(feat) =>
          setBundle((b) => ({
            ...b,
            features: feat,
            project: { ...b.project, stage: "tasks" },
          }))
        }
        onCardsChange={(c) =>
          setBundle((b) => ({
            ...b,
            cards: c,
            project: { ...b.project, stage: "tasks" },
          }))
        }
        onFoundationChange={(foundation_prompt) =>
          setBundle((b) => ({
            ...b,
            project: { ...b.project, foundation_prompt, stage: "tasks" },
          }))
        }
      />
    )
  }

  return null
}
