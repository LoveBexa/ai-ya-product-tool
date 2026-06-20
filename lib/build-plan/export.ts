import type { Feature, Requirements, TaskCard } from "@/lib/types"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"

export interface BuildPlanInput {
  projectTitle: string
  requirements: Requirements
  mustFeatures: Feature[]
  schemaBlueprint: SchemaBlueprint | null
  foundationPrompt: string
  cards: TaskCard[]
}

export function assembleBuildPlanMarkdown({
  projectTitle,
  requirements,
  mustFeatures,
  schemaBlueprint,
  foundationPrompt,
  cards,
}: BuildPlanInput): string {
  const ordered = [...mustFeatures].sort((a, b) => a.sort_order - b.sort_order)
  const lines: string[] = [
    `# ${projectTitle} — Blueprint`,
    "",
    "## 1. Spec Sheet",
    "",
    `**Audience:** ${requirements.audience}`,
    "",
    `**Problem:** ${requirements.problem}`,
    "",
    `**Solution:** ${requirements.solution}`,
    "",
    `**Revenue model / goal:** ${requirements.revenue_model}`,
    "",
    `**Success metric:** ${requirements.success_metric}`,
    "",
    "### Must Have features",
    "",
  ]

  for (const feature of ordered) {
    lines.push(`- **${feature.name}** — ${feature.reasoning}`)
  }

  lines.push(
    "",
    "## 2. Schema blueprint",
    "",
    "_Inferred from Design — user flows, screen inventory, and MVP features._",
    "",
    schemaBlueprint?.markdown.trim() ||
      "_Complete the Design stage to generate a schema blueprint._",
    "",
    "### AI prompt snippet",
    "",
    schemaBlueprint?.promptSnippet.trim() ||
      "_Schema prompt appears here after Design._",
    "",
    "## 3. Foundation step",
    "",
    foundationPrompt.trim() || "_Not generated yet._",
    "",
  )

  lines.push("## 4. Feature steps", "")

  ordered.forEach((feature, index) => {
    const featureCards = cards
      .filter((c) => c.feature_id === feature.id && c.card_type !== "blueprint")
      .sort((a, b) => a.sort_order - b.sort_order)

    lines.push(`### Step ${index + 1}: ${feature.name}`, "")

    if (featureCards.length === 0) {
      lines.push("_No build prompt yet._", "")
    } else if (featureCards.length === 1) {
      lines.push("#### Feature prompt", "", featureCards[0].ai_prompt.trim(), "")
    } else {
      featureCards.forEach((card, cardIndex) => {
        lines.push(`#### Feature prompt ${cardIndex + 1}: ${card.title}`, "", card.ai_prompt.trim(), "")
      })
    }

    lines.push(
      "#### Verify",
      "",
      feature.verify.trim() || "_No verify check yet._",
      "",
    )
  })

  return lines.join("\n")
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
