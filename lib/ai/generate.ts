import { generateText, Output } from "ai"
import { z } from "zod"
import { BA_MODEL } from "./model"
import {
  REQUIREMENTS_SYSTEM,
  FEATURES_SYSTEM,
  QUEUE_SYSTEM,
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
