import { generateText, Output } from "ai"
import { z } from "zod"
import { BA_MODEL } from "./model"
import {
  REQUIREMENTS_SYSTEM,
  FEATURES_SYSTEM,
  DISCOVERY_OUTPUT_SYSTEM,
  QUEUE_SYSTEM,
  QUEUE_BATCH_SYSTEM,
  FOUNDATION_SYSTEM,
  DESIGN_SYSTEM,
} from "./prompts"
import type {
  ChatMessage,
  RequirementsDraft,
  FeatureDraft,
  CardDraft,
  Feature,
  Requirements,
} from "@/lib/types"
import {
  hydrateProductDesign,
  type DesignDraft,
} from "@/lib/design/hydrate-design"
import type { ProductDesign } from "@/lib/types/design"
import { assembleBlueprintPromptContext } from "./blueprint-context"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"

const GEN_OPTS = { maxRetries: 1 } as const

function transcript(messages: ChatMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "Founder" : "Analyst"}: ${m.content}`)
    .join("\n")
}

const requirementsSchema = z.object({
  audience: z.string(),
  problem: z.string(),
  solution: z.string(),
  revenue_model: z.string(),
  success_metric: z.string(),
})

export async function generateRequirements(
  messages: ChatMessage[],
  idea: string,
): Promise<RequirementsDraft> {
  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: REQUIREMENTS_SYSTEM,
    prompt: `Initial idea: "${idea}"\n\nDiscovery conversation:\n${transcript(messages)}\n\nWrite the requirements brief.`,
    output: Output.object({ schema: requirementsSchema }),
  })
  return output
}

const featuresSchema = z.object({
  features: z.array(
    z.object({
      name: z.string(),
      priority: z.enum(["must", "nice", "ignore"]),
      reasoning: z.string(),
    }),
  ),
})

export async function generateFeatures(
  req: RequirementsDraft,
): Promise<FeatureDraft[]> {
  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: FEATURES_SYSTEM,
    prompt: `Requirements brief:
- Audience: ${req.audience}
- Problem: ${req.problem}
- Solution: ${req.solution}
- Revenue model / goal: ${req.revenue_model}
- Success metric: ${req.success_metric}

Produce the prioritized MVP feature list.`,
    output: Output.object({ schema: featuresSchema }),
  })
  return output.features
}

const discoveryBundleSchema = z.object({
  requirements: requirementsSchema,
  features: z.array(
    z.object({
      name: z.string(),
      priority: z.enum(["must", "nice", "ignore"]),
      reasoning: z.string(),
    }),
  ),
})

/** Requirements + MVP features in a single API call. */
export async function generateDiscoveryBundle(
  messages: ChatMessage[],
  idea: string,
): Promise<{ requirements: RequirementsDraft; features: FeatureDraft[] }> {
  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: DISCOVERY_OUTPUT_SYSTEM,
    prompt: `Initial idea: "${idea}"\n\nDiscovery conversation:\n${transcript(messages)}\n\nWrite the requirements brief and prioritized MVP feature list.`,
    output: Output.object({ schema: discoveryBundleSchema }),
  })
  return { requirements: output.requirements, features: output.features }
}

const queueItemSchema = z.object({
  title: z.string(),
  goal: z.string(),
  screens: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
  test_steps: z.array(z.string()),
  dependencies: z.array(z.string()),
  how_to_build: z.string(),
  ai_prompt: z.string(),
  resource_query: z.string(),
  verify: z.string(),
})

export interface QueueItemResult extends CardDraft {
  verify: string
}

export async function generateQueueItem(
  featureName: string,
  featureReasoning: string,
  req: RequirementsDraft,
): Promise<QueueItemResult> {
  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: QUEUE_SYSTEM,
    prompt: `Product context — Solution: ${req.solution}. Audience: ${req.audience}.

Must-have feature: "${featureName}"
Why it matters: ${featureReasoning}

Produce ONE execution spec.`,
    output: Output.object({ schema: queueItemSchema }),
  })
  return {
    ...output,
    subtasks: output.acceptance_criteria,
    how_to_build: output.how_to_build ?? "",
    how_to_test: output.test_steps.join(". "),
    verify: output.verify,
  }
}

const blueprintBatchSchema = z.object({
  foundation_prompt: z.string(),
  cards: z.array(
    z.object({
      feature_name: z.string(),
      goal: z.string(),
      screens: z.array(z.string()),
      acceptance_criteria: z.array(z.string()),
      test_steps: z.array(z.string()),
      dependencies: z.array(z.string()),
      how_to_build: z.string(),
      ai_prompt: z.string(),
      resource_query: z.string(),
      verify: z.string(),
    }),
  ),
})

export interface BlueprintBatchInput {
  idea: string
  req: RequirementsDraft
  mustFeatures: FeatureDraft[]
  allFeatures: Feature[]
  design: ProductDesign
  schemaBlueprint: SchemaBlueprint
}

export interface BlueprintBatchResult {
  foundation_prompt: string
  items: QueueItemResult[]
}

/** All must-have execution cards + foundation prompt in one API call. */
export async function generateBlueprintBatch(
  input: BlueprintBatchInput,
): Promise<BlueprintBatchResult> {
  const mustList = input.mustFeatures
    .map((f) => `- ${f.name}: ${f.reasoning}`)
    .join("\n")

  const context = assembleBlueprintPromptContext({
    idea: input.idea,
    req: input.req,
    allFeatures: input.allFeatures,
    design: input.design,
    schema: input.schemaBlueprint,
  })

  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: QUEUE_BATCH_SYSTEM,
    prompt: `${context}

Must-have MVP features (return exactly one card per feature, using exact feature_name):
${mustList}

Produce the complete blueprint: foundation_prompt + one execution card per must-have.`,
    output: Output.object({ schema: blueprintBatchSchema }),
  })

  const items = output.cards.map((card) => ({
    title: card.feature_name,
    goal: card.goal,
    screens: card.screens ?? [],
    acceptance_criteria: card.acceptance_criteria,
    test_steps: card.test_steps,
    dependencies: card.dependencies ?? [],
    how_to_build: card.how_to_build ?? "",
    ai_prompt: card.ai_prompt,
    resource_query: card.resource_query,
    subtasks: card.acceptance_criteria,
    how_to_test: card.test_steps.join(". "),
    verify: card.verify,
  }))

  return { foundation_prompt: output.foundation_prompt, items }
}

const foundationSchema = z.object({
  prompt: z.string(),
})

export async function generateFoundationPrompt(
  req: RequirementsDraft,
  mustFeatures: FeatureDraft[],
): Promise<string> {
  const featureList = mustFeatures
    .map((f) => `- ${f.name}: ${f.reasoning}`)
    .join("\n")

  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: FOUNDATION_SYSTEM,
    prompt: `Requirements brief:
- Audience: ${req.audience}
- Problem: ${req.problem}
- Solution: ${req.solution}
- Revenue model / goal: ${req.revenue_model}
- Success metric: ${req.success_metric}

Must-have features (build these AFTER the foundation shell):
${featureList}

Write the foundation scaffolding prompt.`,
    output: Output.object({ schema: foundationSchema }),
  })
  return output.prompt
}

const designDraftSchema = z.object({
  user_flow: z.array(
    z.object({
      label: z.string(),
      feature_names: z.array(z.string()),
    }),
  ),
  workflow: z.array(
    z.object({
      label: z.string(),
      feature_names: z.array(z.string()),
    }),
  ),
  screens: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      feature_names: z.array(z.string()),
      user_flow_labels: z.array(z.string()),
    }),
  ),
})

export async function generateDesign(
  projectId: string,
  idea: string,
  req: Requirements,
  mustFeatures: Feature[],
): Promise<ProductDesign> {
  const featureList = mustFeatures
    .map((f) => `- ${f.name}: ${f.reasoning}`)
    .join("\n")

  const { output } = await generateText({
    ...GEN_OPTS,
    model: BA_MODEL,
    system: DESIGN_SYSTEM,
    prompt: `Product idea: "${idea}"

Requirements:
- Audience: ${req.audience}
- Problem: ${req.problem}
- Solution: ${req.solution}
- Revenue model / goal: ${req.revenue_model}
- Success metric: ${req.success_metric}

Must-have MVP features (ONLY design for these):
${featureList}

Produce user flows and screens.`,
    output: Output.object({ schema: designDraftSchema }),
  })

  return hydrateProductDesign(projectId, output as DesignDraft, mustFeatures)
}

/** @deprecated Use generateQueueItem */
export const generateFeatureCards = async (
  featureName: string,
  featureReasoning: string,
  req: RequirementsDraft,
): Promise<CardDraft[]> => [await generateQueueItem(featureName, featureReasoning, req)]

export const generateCards = generateFeatureCards
