import type { Feature } from "@/lib/types"
import type { ProductDesign, WireframeZoneVariant } from "@/lib/types/design"

export interface DesignDraft {
  user_flow: Array<{ label: string; feature_names: string[] }>
  workflow: Array<{ label: string; feature_names: string[] }>
  screens: Array<{
    name: string
    purpose: string
    feature_names: string[]
    user_flow_labels: string[]
  }>
}

function matchFeatureIds(names: string[], mustFeatures: Feature[]): string[] {
  return names
    .map((name) => {
      const hit = mustFeatures.find(
        (f) => f.name.toLowerCase() === name.toLowerCase(),
      )
      return hit?.id
    })
    .filter((id): id is string => Boolean(id))
}

export function hydrateProductDesign(
  projectId: string,
  draft: DesignDraft,
  mustFeatures: Feature[],
): ProductDesign {
  const prefix = `design-${projectId}`

  const user_flow = draft.user_flow.map((step, i) => ({
    id: `${prefix}-flow-${i}`,
    label: step.label,
    feature_ids: matchFeatureIds(step.feature_names, mustFeatures),
  }))

  const flowIdByLabel = new Map(
    user_flow.map((step) => [step.label.toLowerCase(), step.id]),
  )

  const workflow = draft.workflow.map((step, i) => ({
    id: `${prefix}-wf-${i}`,
    label: step.label,
    feature_ids: matchFeatureIds(step.feature_names, mustFeatures),
  }))

  const screens = draft.screens.map((screen, i) => ({
    id: `${prefix}-screen-${i}`,
    name: screen.name,
    purpose: screen.purpose,
    feature_ids: matchFeatureIds(screen.feature_names, mustFeatures),
    user_flow_ids: screen.user_flow_labels
      .map((label) => flowIdByLabel.get(label.toLowerCase()))
      .filter((id): id is string => Boolean(id)),
  }))

  const wireframes = screens.map((screen, i) => ({
    id: `${prefix}-wire-${i}`,
    screen_id: screen.id,
    title: `${screen.name} layout`,
    feature_ids: screen.feature_ids,
    zones: [
      { label: "Header", variant: "header" as WireframeZoneVariant },
      { label: "Main content", variant: "card" as WireframeZoneVariant },
    ],
  }))

  return {
    project_id: projectId,
    user_flow,
    workflow,
    screens,
    wireframes,
  }
}
