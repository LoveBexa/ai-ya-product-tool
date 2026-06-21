import type { ProjectBundle } from "@/app/actions/projects"

export type StepState = "done" | "current" | "upcoming"

export interface JourneySteps {
  discover: StepState
  define: StepState
  design: StepState
  execute: StepState
  discoverLabel: string
  defineLabel: string
  designLabel: string
  executeLabel: string
}

export function getJourneySteps(bundle: ProjectBundle): JourneySteps {
  const { project, requirements, features } = bundle
  const hasExecuteCards = bundle.cards.some((c) => c.card_type === "feature")
  const mvpDefined = features.some((f) => f.priority === "must")
  const discoveryDone =
    !!requirements || !["discovery"].includes(project.stage)

  let discover: StepState = "current"
  let define: StepState = "upcoming"
  let design: StepState = "upcoming"
  let execute: StepState = "upcoming"

  if (discoveryDone) {
    discover = "done"
    define = mvpDefined ? "done" : "current"
    design = mvpDefined ? "current" : "upcoming"
    execute = "upcoming"
  }

  if (mvpDefined && hasExecuteCards) {
    design = "done"
    execute = bundle.cards.every((c) => c.status === "done") ? "done" : "current"
  } else if (mvpDefined && !hasExecuteCards) {
    design = "current"
  }

  return {
    discover,
    define,
    design,
    execute,
    discoverLabel: "Discover — problem and audience clear",
    defineLabel: "Features — MVP cut set",
    designLabel: "Journey — flows and screens mapped",
    executeLabel: hasExecuteCards
      ? "Blueprint — ready to export"
      : "Blueprint — assemble your export",
  }
}

export function hasExecutePlan(bundle: ProjectBundle): boolean {
  return bundle.cards.some((c) => c.card_type === "feature")
}
