/** Product design artifacts — flows, screens, wireframes from the Design stage. */

export interface FlowStep {
  id: string
  label: string
  /** Define decisions this flow step supports */
  feature_ids: string[]
}

export interface WorkflowStep {
  id: string
  label: string
  feature_ids: string[]
}

export interface ScreenItem {
  id: string
  name: string
  purpose: string
  feature_ids: string[]
  /** User-flow steps this screen belongs to (for grouping in the inventory). */
  user_flow_ids: string[]
}

export type WireframeZoneVariant =
  | "header"
  | "hero"
  | "search"
  | "list"
  | "card"
  | "form"
  | "footer"

export interface WireframeZone {
  label: string
  variant: WireframeZoneVariant
}

export interface Wireframe {
  id: string
  screen_id: string
  title: string
  zones: WireframeZone[]
  feature_ids: string[]
}

export interface ProductDesign {
  project_id: string
  user_flow: FlowStep[]
  workflow: WorkflowStep[]
  screens: ScreenItem[]
  wireframes: Wireframe[]
}

/** Links an Execute card back to Design artifacts (and Define via feature_id). */
export interface DesignTrace {
  feature_id: string
  user_flow_ids: string[]
  workflow_ids: string[]
  screen_ids: string[]
  wireframe_ids: string[]
}

/** @deprecated Use DesignTrace */
export interface DesignLinks {
  feature_name: string
  flow_step: string
  screen_name: string
  wireframe_id: string
}
