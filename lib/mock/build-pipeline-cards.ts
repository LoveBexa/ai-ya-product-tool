import type { Feature, TaskCard } from "@/lib/types"
import { buildExecuteCards } from "@/lib/mock/dog-walking-design"

function cardBase(
  projectId: string,
  partial: Omit<TaskCard, "project_id" | "created_at">,
): TaskCard {
  return { ...partial, project_id: projectId, created_at: new Date().toISOString() }
}

export function buildQueueCards(
  projectId: string,
  features: Feature[],
): TaskCard[] {
  const built = buildExecuteCards(projectId, features)

  return built.map(({ feature, trace, spec }, i) =>
    cardBase(projectId, {
      id: `design-queue-${projectId}-${i}`,
      feature_id: feature.id,
      card_type: "feature",
      title: feature.name,
      goal: spec.goal,
      screens: [],
      acceptance_criteria: spec.acceptance_criteria,
      test_steps: spec.test_steps,
      dependencies: [],
      how_to_build: spec.implementation,
      how_to_test: spec.test_steps.join(". "),
      subtasks: spec.acceptance_criteria,
      ai_prompt: `Implement "${feature.name}": ${spec.implementation}`,
      resource_query: `how to build ${feature.name.toLowerCase()} web app`,
      user_journey: "",
      success_criteria: [],
      deferred_stages: [],
      design_trace: trace,
      status: i === 0 ? "in_progress" : "todo",
      sort_order: i,
    }),
  )
}

export function sampleCards(projectId: string, features: Feature[]) {
  return buildQueueCards(projectId, features)
}
