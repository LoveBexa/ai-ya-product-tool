import type { Feature, RequirementsDraft } from "@/lib/types"
import type { ProductDesign } from "@/lib/types/design"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"

export function formatRequirementsContext(req: RequirementsDraft): string {
  return `## Requirements (Discover)
- Audience: ${req.audience}
- Problem: ${req.problem}
- Solution: ${req.solution}
- Revenue model / goal: ${req.revenue_model}
- Success metric: ${req.success_metric}`
}

export function formatFeaturesContext(features: Feature[]): string {
  const byPriority = (p: Feature["priority"]) =>
    features.filter((f) => f.priority === p)

  const formatList = (list: Feature[]) =>
    list.length === 0
      ? "(none)"
      : list.map((f) => `- ${f.name}: ${f.reasoning}`).join("\n")

  return `## MVP scope (Features)
### Must have (build these)
${formatList(byPriority("must"))}

### Later (defer)
${formatList(byPriority("nice"))}

### Ignore (out of scope for v1)
${formatList(byPriority("ignore"))}`
}

export function formatDesignContext(design: ProductDesign): string {
  const flowLines = design.user_flow
    .map((step, i) => `${i + 1}. ${step.label}`)
    .join("\n")

  const workflowLines =
    design.workflow.length > 0
      ? design.workflow.map((step) => `- ${step.label}`).join("\n")
      : "(none)"

  const screenLines = design.screens
    .map((s) => `- ${s.name}: ${s.purpose}`)
    .join("\n")

  return `## UX design (Design)
### User flow
${flowLines}

### System workflow
${workflowLines}

### Screen inventory
${screenLines}`
}

export function formatSchemaContext(schema: SchemaBlueprint): string {
  return `## Schema blueprint (derived from Design)
${schema.promptSnippet.trim()}`
}

export function assembleBlueprintPromptContext(input: {
  idea: string
  req: RequirementsDraft
  allFeatures: Feature[]
  design: ProductDesign
  schema: SchemaBlueprint
}): string {
  return [
    `Product idea: "${input.idea}"`,
    "",
    formatRequirementsContext(input.req),
    "",
    formatFeaturesContext(input.allFeatures),
    "",
    formatDesignContext(input.design),
    "",
    formatSchemaContext(input.schema),
  ].join("\n")
}

export function userJourneyForFeature(
  design: ProductDesign,
  featureId: string,
): string {
  return design.user_flow
    .filter((step) => step.feature_ids.includes(featureId))
    .map((step) => step.label)
    .join(" → ")
}

export function screensForFeature(
  design: ProductDesign,
  featureId: string,
): string[] {
  return design.screens
    .filter((s) => s.feature_ids.includes(featureId))
    .map((s) => s.name)
}
