"use client"

import { useMemo } from "react"
import { deriveSchemaBlueprint } from "@/lib/design/schema-blueprint"
import { saveProductDesign } from "@/app/actions/projects"
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
  const design = bundle.design

  const mustFeatures = useMemo(
    () => features.filter((f) => f.priority === "must"),
    [features],
  )

  const schemaBlueprint = useMemo(
    () => (design ? deriveSchemaBlueprint(design, mustFeatures) : null),
    [design, mustFeatures],
  )

  function patchDesign(next: ProductDesign) {
    setBundle((b) => ({
      ...b,
      design: next,
      project: { ...b.project, product_design: next },
    }))
  }

  if (view === "discover") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DiscoveryChat />
      </div>
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
    if (design && schemaBlueprint) {
      return (
        <DesignView
          design={design}
          features={features}
          schemaBlueprint={schemaBlueprint}
          onScreenPurposeChange={(screenId, purpose) => {
            const next: ProductDesign = {
              ...design,
              screens: design.screens.map((s) =>
                s.id === screenId ? { ...s, purpose } : s,
              ),
            }
            patchDesign(next)
            saveProductDesign(projectId, next).catch(() => {})
          }}
        />
      )
    }
    return <DesignPlaceholder />
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
