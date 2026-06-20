import type { Feature, Requirements, TaskCard } from "@/lib/types"
import type { ProductDesign } from "@/lib/types/design"
import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"

export interface BuildPlanInput {
  projectTitle: string
  requirements: Requirements
  mustFeatures: Feature[]
  allFeatures?: Feature[]
  design?: ProductDesign | null
  schemaBlueprint: SchemaBlueprint | null
  foundationPrompt: string
  cards: TaskCard[]
}

export function assembleBuildPlanMarkdown({
  projectTitle,
  requirements,
  mustFeatures,
  allFeatures = mustFeatures,
  design,
  schemaBlueprint,
  foundationPrompt,
  cards,
}: BuildPlanInput): string {
  const ordered = [...mustFeatures].sort((a, b) => a.sort_order - b.sort_order)
  const later = allFeatures.filter((f) => f.priority === "nice")
  const ignore = allFeatures.filter((f) => f.priority === "ignore")

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

  if (later.length > 0) {
    lines.push("", "### Later (deferred)", "")
    for (const feature of later) {
      lines.push(`- **${feature.name}** — ${feature.reasoning}`)
    }
  }

  if (ignore.length > 0) {
    lines.push("", "### Ignore (out of scope)", "")
    for (const feature of ignore) {
      lines.push(`- **${feature.name}** — ${feature.reasoning}`)
    }
  }

  if (design) {
    lines.push(
      "",
      "## 2. User flows & screens",
      "",
      "### User flow",
      "",
      design.user_flow.map((s, i) => `${i + 1}. ${s.label}`).join("\n"),
      "",
      "### Screens",
      "",
    )
    for (const screen of design.screens) {
      lines.push(`- **${screen.name}** — ${screen.purpose}`)
    }
    lines.push("")
  }

  lines.push(
    design ? "## 3. Schema blueprint" : "## 2. Schema blueprint",
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
    design ? "## 4. Foundation step" : "## 3. Foundation step",
    "",
    foundationPrompt.trim() || "_Not generated yet._",
    "",
  )

  lines.push(design ? "## 5. Feature steps" : "## 4. Feature steps", "")

  ordered.forEach((feature, index) => {
    const featureCards = cards
      .filter((c) => c.feature_id === feature.id && c.card_type !== "blueprint")
      .sort((a, b) => a.sort_order - b.sort_order)

    lines.push(`### Step ${index + 1}: ${feature.name}`, "")

    if (featureCards.length === 0) {
      lines.push("_No build prompt yet._", "")
    } else {
      const card = featureCards[0]
      if (card.goal) {
        lines.push("#### Goal", "", card.goal.trim(), "")
      }
      if (card.how_to_build) {
        lines.push("#### How to build", "", card.how_to_build.trim(), "")
      }
      if (card.screens.length > 0) {
        lines.push("#### Screens", "", card.screens.join(", "), "")
      }
      if (card.acceptance_criteria.length > 0) {
        lines.push("#### Acceptance criteria", "")
        for (const ac of card.acceptance_criteria) {
          lines.push(`- ${ac}`)
        }
        lines.push("")
      }
      if (card.test_steps.length > 0) {
        lines.push("#### Test steps", "")
        for (const step of card.test_steps) {
          lines.push(`- ${step}`)
        }
        lines.push("")
      }
      lines.push("#### Feature prompt", "", card.ai_prompt.trim(), "")
      if (featureCards.length > 1) {
        featureCards.slice(1).forEach((extra, cardIndex) => {
          lines.push(
            `#### Feature prompt ${cardIndex + 2}: ${extra.title}`,
            "",
            extra.ai_prompt.trim(),
            "",
          )
        })
      }
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
  downloadFile(filename, content, "text/markdown;charset=utf-8")
}

export function downloadFile(
  filename: string,
  content: string,
  mimeType = "text/plain;charset=utf-8",
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
