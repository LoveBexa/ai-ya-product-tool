import type { Feature, TaskCard } from "@/lib/types"
import type { SchemaBlueprint, SchemaTable } from "@/lib/design/schema-blueprint"
import type { BuildPlanInput } from "./export"

function conceptName(raw: string): string {
  const cleaned = raw.trim()
  if (!cleaned) return "Concept"
  return cleaned
    .replace(/[^a-zA-Z0-9_\s]/g, " ")
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("")
}

function concept(raw: string): string {
  return `:${conceptName(raw)}:`
}

function ensurePeriod(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`
}

function lowercaseFirst(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
}

function goalToAction(goal: string): string {
  const trimmed = goal.trim().replace(/\.$/, "")
  const lower = lowercaseFirst(trimmed)
  if (/^should\b/i.test(lower)) return lower
  if (/^(allow|enable|let|support|provide|ensure)\b/i.test(lower)) return lower
  return lower
}

const ROLE_HINTS = [
  "buyer",
  "seller",
  "cook",
  "owner",
  "walker",
  "admin",
  "vendor",
  "customer",
  "user",
  "host",
  "guest",
  "driver",
  "rider",
] as const

function inferActorConcept(feature: Feature, card: TaskCard | undefined): string {
  const haystack = `${feature.name} ${feature.reasoning} ${card?.goal ?? ""} ${card?.how_to_build ?? ""}`.toLowerCase()
  for (const role of ROLE_HINTS) {
    if (haystack.includes(role)) {
      return concept(role.charAt(0).toUpperCase() + role.slice(1))
    }
  }
  return concept("User")
}

function columnNames(table: SchemaTable): string[] {
  return table.columns
    .map((col) => col.split("(")[0]?.trim())
    .filter((name) => name && !name.startsWith("/*"))
}

function tableDefinition(table: SchemaTable): string {
  const name = concept(table.name)
  const cols = columnNames(table)
  const colHint =
    cols.length > 0
      ? ` Stores ${cols.slice(0, 5).join(", ")}${cols.length > 5 ? ", and related fields" : ""}.`
      : ""
  const featureHint =
    table.features.length > 0
      ? ` Supports MVP features: ${table.features.join(", ")}.`
      : ""
  const screenHint =
    table.screens.length > 0 && !table.screens[0]?.startsWith("/*")
      ? ` Appears on ${table.screens.join(", ")}.`
      : ""

  return `- ${name} is a ${table.name.replace(/_/g, " ")} entity.${colHint}${featureHint}${screenHint}`
}

function assembleDefinitions(
  projectTitle: string,
  solution: string,
  audience: string,
  schemaBlueprint: SchemaBlueprint | null,
): string[] {
  const lines: string[] = []

  const appDescription = solution.trim() || `${projectTitle} application`
  lines.push(`- ${concept("App")} is ${lowercaseFirst(appDescription)}.`)

  if (audience.trim()) {
    lines.push(`- ${concept("Audience")} is ${lowercaseFirst(audience.trim())}.`)
  }

  if (schemaBlueprint) {
    for (const table of schemaBlueprint.tables) {
      lines.push(tableDefinition(table))
    }
  }

  return lines
}

function extractImplementationReqs(foundationPrompt: string): string[] {
  const fp = foundationPrompt.trim()
  if (!fp) {
    return [`- ${concept("Implementation")} should follow the AIYA foundation step once generated.`]
  }

  const lines: string[] = []
  const add = (name: string, text: string) => {
    const line = `- ${concept(name)} ${text}`
    if (!lines.includes(line)) lines.push(line)
  }

  if (/next\.?js|app router/i.test(fp)) {
    add("Implementation", "should use Next.js App Router.")
  }
  if (/typescript/i.test(fp)) {
    add("Implementation", "should use TypeScript.")
  }
  if (/tailwind/i.test(fp)) {
    add("Styling", "should use Tailwind CSS.")
  }
  if (/supabase/i.test(fp)) {
    add("Database", "should use Supabase PostgreSQL.")
    if (/auth/i.test(fp)) {
      add("Authentication", "should use Supabase Auth.")
    }
  }
  if (/stripe/i.test(fp)) {
    add("Payments", "should use Stripe.")
  }
  if (/vercel/i.test(fp)) {
    add("Deployment", "should support Vercel.")
  }
  if (/postgres/i.test(fp) && !/supabase/i.test(fp)) {
    add("Database", "should use PostgreSQL.")
  }

  if (lines.length === 0) {
    const summary = fp.split("\n").find((line) => line.trim()) ?? fp
    add("Implementation", `should ${lowercaseFirst(summary.slice(0, 200))}`)
  }

  return lines
}

function featureCard(cards: TaskCard[], featureId: string): TaskCard | undefined {
  return cards
    .filter((c) => c.feature_id === featureId && c.card_type !== "blueprint")
    .sort((a, b) => a.sort_order - b.sort_order)[0]
}

function assembleTestReqs(mustFeatures: Feature[], cards: TaskCard[]): string[] {
  const lines: string[] = []
  const seen = new Set<string>()

  const push = (text: string) => {
    const line = `- ${concept("ConformanceTests")} ${text}`
    if (seen.has(line)) return
    seen.add(line)
    lines.push(line)
  }

  for (const feature of mustFeatures) {
    const card = featureCard(cards, feature.id)

    for (const ac of card?.acceptance_criteria ?? []) {
      const normalized = lowercaseFirst(ac.trim())
      push(`should verify ${ensurePeriod(normalized).replace(/\.$/, "")}.`)
    }

    for (const step of card?.test_steps ?? []) {
      const normalized = lowercaseFirst(step.trim())
      push(`should ${ensurePeriod(normalized).replace(/\.$/, "")}.`)
    }

    if (feature.verify.trim()) {
      const normalized = lowercaseFirst(feature.verify.trim())
      const body = normalized.startsWith("verify ")
        ? normalized
        : `verify ${normalized.replace(/\.$/, "")}`
      push(`should ${ensurePeriod(body).replace(/\.$/, "")}.`)
    }
  }

  if (lines.length === 0) {
    push("should verify each must-have MVP feature behaves as specified.")
  }

  return lines
}

function entityFunctionalSpec(table: SchemaTable): string | null {
  const cols = columnNames(table).filter(
    (name) => !["id", "created_at", "updated_at"].includes(name),
  )
  if (cols.length === 0) return null
  return `- ${concept(table.name)} should record ${cols.join(", ")}.`
}

function assembleFunctionalSpecs(
  mustFeatures: Feature[],
  cards: TaskCard[],
  schemaBlueprint: SchemaBlueprint | null,
): string[] {
  const lines: string[] = []
  const seen = new Set<string>()

  const push = (line: string) => {
    if (seen.has(line)) return
    seen.add(line)
    lines.push(line)
  }

  for (const feature of mustFeatures) {
    const card = featureCard(cards, feature.id)
    const actor = inferActorConcept(feature, card)

    if (card?.goal.trim()) {
      push(`- ${actor} should ${goalToAction(card.goal)}.`)
    } else {
      push(`- ${actor} should support ${feature.name.toLowerCase()}.`)
    }
  }

  if (schemaBlueprint) {
    for (const table of schemaBlueprint.tables) {
      const spec = entityFunctionalSpec(table)
      if (spec) push(spec)
    }
  }

  return lines
}

export function assemblePlainlangSpec({
  projectTitle,
  requirements,
  mustFeatures,
  schemaBlueprint,
  foundationPrompt,
  cards,
}: BuildPlanInput): string {
  const ordered = [...mustFeatures].sort((a, b) => a.sort_order - b.sort_order)

  const sections: string[] = [
    `***definitions***`,
    "",
    ...assembleDefinitions(
      projectTitle,
      requirements.solution,
      requirements.audience,
      schemaBlueprint,
    ),
    "",
    `***implementation reqs***`,
    "",
    ...extractImplementationReqs(foundationPrompt),
    "",
    `***test reqs***`,
    "",
    ...assembleTestReqs(ordered, cards),
    "",
    `***functional specs***`,
    "",
    ...assembleFunctionalSpecs(ordered, cards, schemaBlueprint),
  ]

  return sections.join("\n").trimEnd() + "\n"
}
