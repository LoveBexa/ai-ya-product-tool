import type { Feature } from "@/lib/types"
import type { ProductDesign, DesignTrace, FlowStep, ScreenItem } from "@/lib/types/design"

export function featureById(features: Feature[], id: string | null): Feature | null {
  if (!id) return null
  return features.find((f) => f.id === id) ?? null
}

export function featureNames(features: Feature[], ids: string[]): string[] {
  return ids
    .map((id) => features.find((f) => f.id === id)?.name)
    .filter((n): n is string => !!n)
}

export function resolveScreenNames(design: ProductDesign, screenIds: string[]): string[] {
  return screenIds
    .map((id) => design.screens.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n)
}

export function resolveFlowLabels(design: ProductDesign, flowIds: string[]): string[] {
  return flowIds
    .map((id) => design.user_flow.find((f) => f.id === id)?.label)
    .filter((n): n is string => !!n)
}

/** User-flow steps a screen belongs to — explicit IDs first, then feature overlap. */
export function flowsForScreen(
  design: ProductDesign,
  screen: ScreenItem,
): FlowStep[] {
  if (screen.user_flow_ids.length > 0) {
    return screen.user_flow_ids
      .map((id) => design.user_flow.find((f) => f.id === id))
      .filter((f): f is FlowStep => !!f)
  }

  const inferred = design.user_flow.filter((step) =>
    step.feature_ids.some((fid) => screen.feature_ids.includes(fid)),
  )
  if (inferred.length > 0) return inferred

  if (screen.feature_ids.length === 0) {
    return design.user_flow.filter((step) => step.feature_ids.length === 0)
  }

  return []
}

export function flowLabelsForScreen(
  design: ProductDesign,
  screen: ScreenItem,
): string[] {
  return flowRefsForScreen(design, screen).map(
    (ref) => `${ref.step}. ${ref.label}`,
  )
}

export interface ScreenFlowRef {
  step: number
  label: string
}

/** Numbered user-flow steps for a screen (matches the flow chain above). */
export function flowRefsForScreen(
  design: ProductDesign,
  screen: ScreenItem,
): ScreenFlowRef[] {
  return flowsForScreen(design, screen)
    .map((step) => {
      const index = design.user_flow.findIndex((f) => f.id === step.id)
      return {
        step: index >= 0 ? index + 1 : 0,
        label: step.label,
      }
    })
    .filter((ref) => ref.step > 0)
    .sort((a, b) => a.step - b.step)
}

/** Single-line flow chain for screen cards, e.g. "1.Sign up ---> 2.Profile" */
export function formatScreenFlowLine(flowRefs: ScreenFlowRef[]): string | null {
  if (flowRefs.length === 0) return null
  return flowRefs.map((ref) => `${ref.step}.${ref.label}`).join(" ---> ")
}

export function resolveWorkflowLabels(design: ProductDesign, workflowIds: string[]): string[] {
  return workflowIds
    .map((id) => design.workflow.find((w) => w.id === id)?.label)
    .filter((n): n is string => !!n)
}

export function resolveWireframeTitles(design: ProductDesign, wireframeIds: string[]): string[] {
  return wireframeIds
    .map((id) => design.wireframes.find((w) => w.id === id)?.title)
    .filter((n): n is string => !!n)
}

export function dependencyNames(features: Feature[], ids: string[]): string[] {
  return featureNames(features, ids)
}

export interface TraceLabels {
  flows: string[]
  workflows: string[]
  screens: string[]
  wireframes: string[]
}

export function traceLabels(design: ProductDesign, trace: DesignTrace): TraceLabels {
  return {
    flows: resolveFlowLabels(design, trace.user_flow_ids),
    workflows: resolveWorkflowLabels(design, trace.workflow_ids),
    screens: resolveScreenNames(design, trace.screen_ids),
    wireframes: resolveWireframeTitles(design, trace.wireframe_ids),
  }
}
