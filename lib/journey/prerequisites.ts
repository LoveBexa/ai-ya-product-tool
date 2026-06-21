import type { ProjectBundle } from "@/app/actions/projects"
import type { JourneyStop } from "@/lib/journey/navigation"
import { hasExecutePlan } from "@/lib/journey/status"

export interface StageBlocker {
  stop: JourneyStop
  message: string
}

function userExchangeCount(bundle: ProjectBundle): number {
  return (bundle.project.chat ?? []).filter((m) => m.role === "user").length
}

export function isDefineEmpty(bundle: ProjectBundle): boolean {
  return bundle.features.length === 0
}

export function isDesignEmpty(bundle: ProjectBundle): boolean {
  return bundle.design == null
}

export function isBlueprintEmpty(bundle: ProjectBundle): boolean {
  return !hasExecutePlan(bundle)
}

export function isDiscoveryComplete(bundle: ProjectBundle): boolean {
  return bundle.requirements != null && bundle.features.length > 0
}

/** Blockers for generating requirements onto the Define board. */
export function getRequirementsGenerateBlocker(
  bundle: ProjectBundle,
): StageBlocker | null {
  if (userExchangeCount(bundle) < 2 && !bundle.requirements) {
    return {
      stop: "discover",
      message:
        "Discovery isn't finished yet — answer a few questions in the chat before generating requirements.",
    }
  }
  return null
}

/** Blockers for creating design flows. */
export function getDesignGenerateBlocker(
  bundle: ProjectBundle,
): StageBlocker | null {
  if (!bundle.requirements) {
    return {
      stop: "discover",
      message:
        "Finish Discover first — generate requirements before mapping the journey.",
    }
  }
  if (!bundle.features.some((f) => f.priority === "must")) {
    return {
      stop: "define",
      message:
        "Add at least one Must Have feature before mapping the journey.",
    }
  }
  return null
}

/** Blockers for creating the blueprint. */
export function getBlueprintGenerateBlocker(
  bundle: ProjectBundle,
): StageBlocker | null {
  if (!bundle.requirements) {
    return {
      stop: "discover",
      message:
        "Finish Discover first — generate requirements before creating your blueprint.",
    }
  }
  if (!bundle.features.some((f) => f.priority === "must")) {
    return {
      stop: "define",
      message:
        "Add at least one Must Have feature before creating your blueprint.",
    }
  }
  if (!bundle.design) {
    return {
      stop: "design",
      message:
        "Map the journey first — your blueprint needs flows, screens, and schema.",
    }
  }
  return null
}

/** Which pipeline stage the user should return to when a later stage is blocked. */
export function blockedPipelineStop(bundle: ProjectBundle): JourneyStop | null {
  return (
    getBlueprintGenerateBlocker(bundle)?.stop ??
    getDesignGenerateBlocker(bundle)?.stop ??
    getRequirementsGenerateBlocker(bundle)?.stop ??
    null
  )
}
