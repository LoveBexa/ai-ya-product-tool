import type { Feature } from "@/lib/types"
import type { ProductDesign } from "@/lib/types/design"

export interface SchemaTable {
  name: string
  columns: string[]
  screens: string[]
  /** Must-have features this table supports */
  features: string[]
}

export interface SchemaBlueprint {
  tables: SchemaTable[]
  screenMap: { screen: string; tables: string }[]
  markdown: string
  promptSnippet: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 48)
}

function dogWalkingSchemaTables(mustFeatures: Feature[]): SchemaTable[] {
  const sorted = [...mustFeatures].sort((a, b) => a.sort_order - b.sort_order)
  const fname = (i: number) => sorted[i]?.name ?? `Feature ${i + 1}`

  return [
    {
      name: "profiles",
      columns: [
        "id (uuid, pk, references auth.users)",
        "role (owner | walker)",
        "display_name (text)",
        "created_at (timestamptz)",
      ],
      screens: ["Sign up", "Dashboard"],
      features: [fname(0)],
    },
    {
      name: "walkers",
      columns: [
        "id (uuid, pk)",
        "profile_id (uuid, fk → profiles)",
        "bio (text)",
        "neighbourhood (text)",
        "hourly_rate (numeric)",
        "avg_rating (numeric)",
      ],
      screens: ["Search", "Walker profile"],
      features: [fname(1)],
    },
    {
      name: "bookings",
      columns: [
        "id (uuid, pk)",
        "owner_id (uuid, fk → profiles)",
        "walker_id (uuid, fk → walkers)",
        "scheduled_at (timestamptz)",
        "status (pending | confirmed | completed)",
        "notes (text)",
      ],
      screens: ["Walker profile", "Checkout", "Booking history"],
      features: [fname(2)],
    },
    {
      name: "reviews",
      columns: [
        "id (uuid, pk)",
        "booking_id (uuid, fk → bookings)",
        "rating (int, 1–5)",
        "comment (text)",
        "created_at (timestamptz)",
      ],
      screens: ["Booking history", "Walker profile"],
      features: [fname(3)],
    },
  ]
}

function genericSchemaTables(
  design: ProductDesign,
  mustFeatures: Feature[],
): SchemaTable[] {
  return mustFeatures.map((feature) => {
    const tableName = slugify(feature.name) || "entity"
    const linkedScreens = design.screens
      .filter((s) => s.feature_ids.includes(feature.id))
      .map((s) => s.name)

    return {
      name: tableName,
      columns: [
        "id (uuid, pk)",
        "created_at (timestamptz)",
        `/* fields for: ${feature.name} */`,
      ],
      screens: linkedScreens.length > 0 ? linkedScreens : ["/* link screens in Design */"],
      features: [feature.name],
    }
  })
}

export function schemaTablesFromDesign(
  design: ProductDesign,
  mustFeatures: Feature[],
): SchemaTable[] {
  const names = new Set(design.screens.map((s) => s.name))

  if (names.has("Search") && names.has("Walker profile")) {
    return dogWalkingSchemaTables(mustFeatures)
  }

  return genericSchemaTables(design, mustFeatures)
}

export function screenTableMapForDesign(
  design: ProductDesign,
  tables: SchemaTable[],
): { screen: string; tables: string }[] {
  const mapped = new Map<string, Set<string>>()
  for (const table of tables) {
    for (const screen of table.screens) {
      if (screen.startsWith("/*")) continue
      if (!mapped.has(screen)) mapped.set(screen, new Set())
      mapped.get(screen)!.add(table.name)
    }
  }

  return design.screens.map((screen) => ({
    screen: screen.name,
    tables: [...(mapped.get(screen.name) ?? [])].sort().join(", ") || "—",
  }))
}

function formatMarkdown(
  design: ProductDesign,
  tables: SchemaTable[],
  mustFeatures: Feature[],
): string {
  const lines: string[] = [
    "_Derived from user flows, screen inventory, and MVP features._",
    "",
  ]

  const flowLine = design.user_flow.map((s) => s.label).join(" → ")
  if (flowLine) {
    lines.push(`**User flow:** ${flowLine}`, "")
  }

  for (const table of tables) {
    lines.push(`### ${table.name}`, "")
    for (const col of table.columns) {
      lines.push(`- ${col}`)
    }
    lines.push("")
    if (table.screens.length > 0) {
      lines.push(`**Screens:** ${table.screens.join(", ")}`, "")
    }
    if (table.features.length > 0) {
      lines.push(`**MVP features:** ${table.features.join(", ")}`, "")
    }
    lines.push("")
  }

  lines.push("#### Screen → table map", "", "| Screen | Tables |", "| --- | --- |")
  for (const row of screenTableMapForDesign(design, tables)) {
    lines.push(`| ${row.screen} | ${row.tables} |`)
  }
  lines.push("")

  if (mustFeatures.length > 0) {
    lines.push("#### MVP features → tables", "")
    for (const feature of mustFeatures) {
      const tablesForFeature = tables
        .filter((t) => t.features.includes(feature.name))
        .map((t) => t.name)
      lines.push(
        `- **${feature.name}** → ${tablesForFeature.length > 0 ? tablesForFeature.join(", ") : "_(assign in Design)_"}`,
      )
    }
    lines.push("")
  }

  return lines.join("\n")
}

function formatPromptSnippet(
  design: ProductDesign,
  tables: SchemaTable[],
): string {
  const lines: string[] = [
    "Implement this potential database schema (Supabase/Postgres).",
    "It was inferred from the product user flows, screens, and MVP features.",
    "",
  ]

  const flowLine = design.user_flow.map((s) => s.label).join(" → ")
  if (flowLine) {
    lines.push(`User flow: ${flowLine}`, "")
  }

  for (const table of tables) {
    lines.push(`${table.name}`)
    for (const col of table.columns) {
      lines.push(`  - ${col}`)
    }
    if (table.screens.length > 0 && !table.screens[0]?.startsWith("/*")) {
      lines.push(`  Screens: ${table.screens.join(", ")}`)
    }
    if (table.features.length > 0) {
      lines.push(`  MVP: ${table.features.join(", ")}`)
    }
    lines.push("")
  }

  lines.push(
    "Create migrations for these tables only. Wire auth if profiles/users exist.",
    "Do not build feature UI yet — schema + RLS stubs are enough for the foundation step.",
  )

  return lines.join("\n")
}

export function deriveSchemaBlueprint(
  design: ProductDesign,
  mustFeatures: Feature[],
): SchemaBlueprint {
  const tables = schemaTablesFromDesign(design, mustFeatures)
  const screenMap = screenTableMapForDesign(design, tables)

  return {
    tables,
    screenMap,
    markdown: formatMarkdown(design, tables, mustFeatures),
    promptSnippet: formatPromptSnippet(design, tables),
  }
}

/** @deprecated Use deriveSchemaBlueprint */
export function defaultSchemaMarkdown(
  design?: ProductDesign | null,
  mustFeatures: Feature[] = [],
): string {
  if (!design) return ""
  return deriveSchemaBlueprint(design, mustFeatures).markdown
}
