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
  idea: string
  stage: ProjectStage
  chat: ChatMessage[]
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
  created_at: string
}

export type CardStatus = "todo" | "in_progress" | "done"

export interface TaskCard {
  id: string
  feature_id: string
  project_id: string
  title: string
  goal: string
  subtasks: string[]
  ai_prompt: string
  resource_query: string
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
}

export interface CardDraft {
  title: string
  goal: string
  subtasks: string[]
  ai_prompt: string
  resource_query: string
}
