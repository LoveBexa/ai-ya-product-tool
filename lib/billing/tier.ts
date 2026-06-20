export type BillingTier = "free" | "paid"

export interface TierLimits {
  maxProjects: number
  maxBlueprints: number
}

export const TIER_LIMITS: Record<BillingTier, TierLimits> = {
  free: { maxProjects: 1, maxBlueprints: 1 },
  paid: { maxProjects: Number.POSITIVE_INFINITY, maxBlueprints: Number.POSITIVE_INFINITY },
}

export const TIER_LABEL: Record<BillingTier, string> = {
  free: "Free",
  paid: "Paid",
}

export const TIER_UPGRADE_NOTE =
  "Paid tier — unlimited projects and blueprints — coming soon."

export const TIER_MESSAGES = {
  projectLimit:
    "Free plan includes 1 project. Delete your existing project or upgrade when Paid launches.",
  blueprintLimit:
    "Free plan includes 1 blueprint. Your free blueprint is already on another project, or upgrade when Paid launches.",
} as const

export function resolveBillingTier(): BillingTier {
  return process.env.AIYA_BILLING_TIER === "paid" ? "paid" : "free"
}

export function isPaidTier(tier: BillingTier): boolean {
  return tier === "paid"
}

export function canCreateProject(
  tier: BillingTier,
  projectCount: number,
): boolean {
  return projectCount < TIER_LIMITS[tier].maxProjects
}

/** Regenerating a blueprint on the same project stays allowed on Free. */
export function canCreateBlueprint(
  tier: BillingTier,
  blueprintProjectCount: number,
  projectAlreadyHasBlueprint: boolean,
): boolean {
  if (isPaidTier(tier)) return true
  if (projectAlreadyHasBlueprint) return true
  return blueprintProjectCount < TIER_LIMITS.free.maxBlueprints
}

export function freePlanSummary(): string {
  return "1 project · 1 blueprint"
}
