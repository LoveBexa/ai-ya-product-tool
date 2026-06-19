import { generateText, Output } from "ai"
import { z } from "zod"
import { BA_MODEL } from "./model"
import {
  REQUIREMENTS_SYSTEM,
  FEATURES_SYSTEM,
  CARDS_SYSTEM,
} from "./prompts"
import type {
  ChatMessage,
  RequirementsDraft,
  FeatureDraft,
  CardDraft,
} from "@/lib/types"

function transcript(messages: ChatMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "Founder" : "Analyst"}: ${m.content}`)
    .join("\n")
}

const requirementsSchema = z.object({
  audience: z.string(),
  problem: z.string(),
  solution: z.string(),
  competitive_landscape: z.string(),
  differentiation: z.string(),
  revenue_model: z.string(),
  success_metric: z.string(),
})

export async function generateRequirements(
  messages: ChatMessage[],
  idea: string,
): Promise<RequirementsDraft> {
  const { output } = await generateText({
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
    model: BA_MODEL,
    system: FEATURES_SYSTEM,
    prompt: `Requirements brief:
- Audience: ${req.audience}
- Problem: ${req.problem}
- Solution: ${req.solution}
- Competitive landscape: ${req.competitive_landscape}
- Differentiation strategy: ${req.differentiation}
- Revenue model / goal: ${req.revenue_model}
- Success metric: ${req.success_metric}

Produce the prioritized MVP feature list. Features that deliver the differentiation strategy should lean toward "must"; generic table-stakes features that don't advance the wedge can be "nice" or "ignore" for v1.`,
    output: Output.object({ schema: featuresSchema }),
  })
  return output.features
}

const cardsSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      goal: z.string(),
      subtasks: z.array(z.string()),
      ai_prompt: z.string(),
      resource_query: z.string(),
    }),
  ),
})

export async function generateCards(
  featureName: string,
  featureReasoning: string,
  req: RequirementsDraft,
): Promise<CardDraft[]> {
  const { output } = await generateText({
    model: BA_MODEL,
    system: CARDS_SYSTEM,
    prompt: `Product context — Solution: ${req.solution}. Audience: ${req.audience}.

Feature to break down: "${featureName}"
Why it matters: ${featureReasoning}

Produce the task cards for this feature.`,
    output: Output.object({ schema: cardsSchema }),
  })
  return output.cards
}
