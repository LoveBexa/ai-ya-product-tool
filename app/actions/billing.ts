"use server"

import {
  canCreateBlueprint,
  canCreateProject,
  freePlanSummary,
  resolveBillingTier,
  TIER_LABEL,
  TIER_LIMITS,
  TIER_MESSAGES,
  type BillingTier,
} from "@/lib/billing/tier"
import {
  countBlueprintProjects,
  countProjects,
  projectHasBlueprint,
} from "@/lib/billing/quota.server"

export interface TierUsageSnapshot {
  tier: BillingTier
  tierLabel: string
  planSummary: string
  limits: TierLimitsSnapshot
  usage: {
    projects: number
    blueprints: number
  }
  canCreateProject: boolean
  canCreateBlueprint: boolean
  projectLimitMessage: string | null
  blueprintLimitMessage: string | null
}

export interface TierLimitsSnapshot {
  maxProjects: number
  maxBlueprints: number
}

export async function getTierUsage(
  projectId?: string,
): Promise<TierUsageSnapshot> {
  const tier = resolveBillingTier()
  const [projects, blueprints, hasBlueprint] = await Promise.all([
    countProjects(),
    countBlueprintProjects(),
    projectId ? projectHasBlueprint(projectId) : Promise.resolve(false),
  ])

  const allowProject = canCreateProject(tier, projects)
  const allowBlueprint = projectId
    ? canCreateBlueprint(tier, blueprints, hasBlueprint)
    : canCreateBlueprint(tier, blueprints, false)

  return {
    tier,
    tierLabel: TIER_LABEL[tier],
    planSummary: tier === "free" ? freePlanSummary() : "Unlimited",
    limits: {
      maxProjects: TIER_LIMITS[tier].maxProjects,
      maxBlueprints: TIER_LIMITS[tier].maxBlueprints,
    },
    usage: { projects, blueprints },
    canCreateProject: allowProject,
    canCreateBlueprint: allowBlueprint,
    projectLimitMessage: allowProject ? null : TIER_MESSAGES.projectLimit,
    blueprintLimitMessage: allowBlueprint ? null : TIER_MESSAGES.blueprintLimit,
  }
}
