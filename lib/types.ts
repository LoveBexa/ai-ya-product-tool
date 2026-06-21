import type { DesignTrace } from "@/lib/types/design"
import type { ProductDesign } from "@/lib/types/design"

/* ------------------------------------------------------------------ *
 *  Shared data model — mirrors the Supabase schema
 *  (projects -> requirements, features, cards). See scripts/schema.sql
 * ------------------------------------------------------------------ */

export type ProjectStage =
  | "discovery"
  | "requirements"
  | "mvp"
  | "tasks"

export interface Project {
  id: string
  title: string
  description: string
  emoji: string
  idea: string
  stage: ProjectStage
  chat: ChatMessage[]
  foundation_prompt: string
  database_schema: string
  product_design: ProductDesign | null
  created_at: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface Requirements {
  id: string
  project_id: string
  audience: string
  problem: string
  solution: string
  revenue_model: string
  success_metric: string
  created_at: string
}

export type FeaturePriority = "must" | "nice" | "ignore"

export interface Feature {
  id: string
  project_id: string
  name: string
  priority: FeaturePriority
  reasoning: string
  sort_order: number
  verify: string
  created_at: string
}

export type CardStatus = "todo" | "in_progress" | "done"
export type CardType = "blueprint" | "feature"

export interface TaskCard {
  id: string
  feature_id: string | null
  project_id: string
  card_type: CardType
  title: string
  goal: string
  subtasks: string[]
  ai_prompt: string
  resource_query: string
  how_to_build: string
  how_to_test: string
  screens: string[]
  acceptance_criteria: string[]
  test_steps: string[]
  dependencies: string[]
  user_journey: string
  success_criteria: string[]
  deferred_stages: string[]
  design_trace?: DesignTrace
  status: CardStatus
  sort_order: number
  created_at: string
}

/* Shapes the AI returns (before they get DB ids) */
export interface RequirementsDraft {
  audience: string
  problem: string
  solution: string
  revenue_model: string
  success_metric: string
}

export interface FeatureDraft {
  name: string
  priority: FeaturePriority
  reasoning: string
  verify?: string
}

export interface CardDraft {
  title: string
  goal: string
  screens: string[]
  acceptance_criteria: string[]
  test_steps: string[]
  dependencies: string[]
  how_to_build: string
  subtasks: string[]
  ai_prompt: string
  resource_query: string
  how_to_test: string
  user_journey?: string
  success_criteria?: string[]
  deferred_stages?: string[]
}

export interface BlueprintDraft extends CardDraft {
  user_journey: string
  success_criteria: string[]
  deferred_stages: string[]
}
