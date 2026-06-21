"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import {
  generateRequirements,
  generateFeatures,
  generateDiscoveryBundle,
  generateDesign,
  generateBlueprintBatch,
  generateFoundationPrompt,
} from "@/lib/ai/generate"
import {
  screensForFeature,
  userJourneyForFeature,
} from "@/lib/ai/blueprint-context"
import { deriveSchemaBlueprint } from "@/lib/design/schema-blueprint"
import type { ProductDesign } from "@/lib/types/design"
import type {
  Project,
  Requirements,
  Feature,
  TaskCard,
  ChatMessage,
  FeaturePriority,
  CardStatus,
  RequirementsDraft,
} from "@/lib/types"
import { DELETE_CONFIRMATION_PHRASE, DEFAULT_PROJECT_TITLE } from "@/lib/projects/constants"
import {
  canCreateBlueprint,
  canCreateProject,
  resolveBillingTier,
  TIER_MESSAGES,
} from "@/lib/billing/tier"
import {
  countBlueprintProjects,
  countProjects,
  projectHasBlueprint,
} from "@/lib/billing/quota.server"

export interface ProjectBundle {
  project: Project
  requirements: Requirements | null
  features: Feature[]
  cards: TaskCard[]
  design: ProductDesign | null
}

/* ---------------------------- Projects ---------------------------- */

export async function createProject(idea: string): Promise<string> {
  const tier = resolveBillingTier()
  const projectCount = await countProjects()
  if (!canCreateProject(tier, projectCount)) {
    throw new Error(TIER_MESSAGES.projectLimit)
  }

  const db = getSupabaseAdmin()
  const trimmedIdea = idea.trim()
  const { data, error } = await db
    .from("projects")
    .insert({
      title: DEFAULT_PROJECT_TITLE,
      description: trimmedIdea,
      idea: trimmedIdea,
      stage: "discovery",
      chat: [],
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  revalidatePath("/")
  revalidatePath("/start")
  return data.id as string
}

export async function listProjects(): Promise<Project[]> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Project[]).map((row) =>
    normalizeProjectRow({
      ...row,
      chat: Array.isArray(row.chat) ? row.chat : [],
    }),
  )
}

export async function deleteProject(projectId: string, confirmationPhrase: string) {
  if (confirmationPhrase !== DELETE_CONFIRMATION_PHRASE) {
    throw new Error("Confirmation phrase did not match.")
  }

  const db = getSupabaseAdmin()
  const { error } = await db.from("projects").delete().eq("id", projectId)
  if (error) throw new Error(error.message)

  revalidatePath("/start")
  revalidatePath("/")
}

export async function updateProjectProfile(
  projectId: string,
  fields: Partial<{ title: string; description: string; emoji: string }>,
): Promise<Project> {
  const update: Record<string, string> = {}
  if (fields.title !== undefined) {
    update.title = fields.title.trim().slice(0, 120) || DEFAULT_PROJECT_TITLE
  }
  if (fields.description !== undefined) {
    update.description = fields.description.trim().slice(0, 2000)
  }
  if (fields.emoji !== undefined) {
    update.emoji = fields.emoji.trim().slice(0, 8)
  }
  if (Object.keys(update).length === 0) {
    throw new Error("Nothing to update")
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("projects")
    .update(update)
    .eq("id", projectId)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/start")
  revalidatePath(`/projects/${projectId}`)
  return normalizeProjectRow(data)
}

/** @deprecated Use updateProjectProfile */
export async function updateProjectTitle(
  projectId: string,
  title: string,
): Promise<Project> {
  return updateProjectProfile(projectId, { title })
}

function normalizeProjectRow(data: Project & { subtitle?: string }): Project {
  const row = data as Project & { subtitle?: string }
  return {
    ...row,
    description: row.description ?? row.subtitle ?? "",
    emoji: row.emoji ?? "",
    foundation_prompt: row.foundation_prompt ?? "",
    database_schema: row.database_schema ?? "",
    product_design: row.product_design ?? null,
  }
}

export async function getProjectBundle(id: string): Promise<ProjectBundle> {
  const db = getSupabaseAdmin()
  const [{ data: project }, { data: req }, { data: features }, { data: cards }] =
    await Promise.all([
      db.from("projects").select("*").eq("id", id).single(),
      db.from("requirements").select("*").eq("project_id", id).maybeSingle(),
      db
        .from("features")
        .select("*")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      db
        .from("cards")
        .select("*")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
    ])

  if (!project) throw new Error("Project not found")

  const raw = project as Project & { product_design?: ProductDesign | null }
  const design = raw.product_design ?? null

  return {
    project: normalizeProjectRow({
      ...raw,
      chat: Array.isArray(raw.chat) ? raw.chat : [],
    } as Project),
    requirements: (req ?? null) as Requirements | null,
    features: ((features ?? []) as Feature[]).map((f) => ({
      ...f,
      verify: f.verify ?? "",
    })),
    cards: ((cards ?? []) as TaskCard[]).map(normalizeCard),
    design,
  }
}

function normalizeCard(card: TaskCard): TaskCard {
  const acceptance =
    card.acceptance_criteria?.length
      ? card.acceptance_criteria
      : card.success_criteria?.length
        ? card.success_criteria
        : card.subtasks ?? []

  const tests =
    card.test_steps?.length
      ? card.test_steps
      : card.how_to_test
        ? card.how_to_test
            .split(/[.;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : []

  return {
    ...card,
    card_type: card.card_type ?? "feature",
    feature_id: card.feature_id ?? null,
    how_to_build: card.how_to_build ?? "",
    how_to_test: card.how_to_test ?? "",
    screens: card.screens ?? [],
    acceptance_criteria: acceptance,
    test_steps: tests,
    dependencies: card.dependencies ?? [],
    user_journey: card.user_journey ?? "",
    success_criteria: card.success_criteria ?? [],
    deferred_stages: card.deferred_stages ?? [],
    design_trace: card.design_trace,
  }
}

export async function saveChat(projectId: string, chat: ChatMessage[]) {
  const db = getSupabaseAdmin()
  const { error } = await db.from("projects").update({ chat }).eq("id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

async function setStage(projectId: string, stage: Project["stage"]) {
  const db = getSupabaseAdmin()
  await db.from("projects").update({ stage }).eq("id", projectId)
}

/* -------------------------- Requirements -------------------------- */

export async function generateAndSaveRequirements(
  projectId: string,
  idea: string,
  chat: ChatMessage[],
): Promise<Requirements> {
  const db = getSupabaseAdmin()
  await saveChat(projectId, chat)

  const draft = await generateRequirements(chat, idea)

  const { data, error } = await db
    .from("requirements")
    .upsert({ project_id: projectId, ...draft }, { onConflict: "project_id" })
    .select("*")
    .single()
  if (error) throw new Error(error.message)

  await setStage(projectId, "requirements")
  revalidatePath(`/projects/${projectId}`)
  return data as Requirements
}

/** Distill discovery chat into requirements, then MVP feature cards for Define. */
export async function finishDiscovery(
  projectId: string,
  idea: string,
  chat: ChatMessage[],
): Promise<{ requirements: Requirements; features: Feature[] }> {
  const db = getSupabaseAdmin()
  await saveChat(projectId, chat)

  const { requirements: draft, features: featureDrafts } =
    await generateDiscoveryBundle(chat, idea)

  const { data: req, error: reqError } = await db
    .from("requirements")
    .upsert({ project_id: projectId, ...draft }, { onConflict: "project_id" })
    .select("*")
    .single()
  if (reqError) throw new Error(reqError.message)

  await db.from("features").delete().eq("project_id", projectId)

  const rows = featureDrafts.map((f, i) => ({
    project_id: projectId,
    name: f.name,
    priority: f.priority,
    reasoning: f.reasoning,
    sort_order: i,
  }))
  const { data: features, error: featError } = await db
    .from("features")
    .insert(rows)
    .select("*")
  if (featError) throw new Error(featError.message)

  await setStage(projectId, "mvp")
  revalidatePath(`/projects/${projectId}`)

  return {
    requirements: req as Requirements,
    features: ((features ?? []) as Feature[]).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }
}

/* ---------------------------- Features ---------------------------- */

export async function generateAndSaveFeatures(
  projectId: string,
): Promise<Feature[]> {
  const db = getSupabaseAdmin()
  const { data: req } = await db
    .from("requirements")
    .select("*")
    .eq("project_id", projectId)
    .single()
  if (!req) throw new Error("Requirements must exist before generating features")

  const drafts = await generateFeatures(req as RequirementsDraft)

  // Replace any existing features for a clean regenerate.
  await db.from("features").delete().eq("project_id", projectId)

  const rows = drafts.map((f, i) => ({
    project_id: projectId,
    name: f.name,
    priority: f.priority,
    reasoning: f.reasoning,
    sort_order: i,
  }))
  const { data, error } = await db.from("features").insert(rows).select("*")
  if (error) throw new Error(error.message)

  await setStage(projectId, "mvp")
  revalidatePath(`/projects/${projectId}`)
  return ((data ?? []) as Feature[]).sort((a, b) => a.sort_order - b.sort_order)
}

/* ----------------------------- Design ----------------------------- */

export async function generateAndSaveDesign(
  projectId: string,
): Promise<ProductDesign> {
  const db = getSupabaseAdmin()
  const [{ data: project }, { data: req }, { data: features }] =
    await Promise.all([
      db.from("projects").select("*").eq("id", projectId).single(),
      db.from("requirements").select("*").eq("project_id", projectId).single(),
      db
        .from("features")
        .select("*")
        .eq("project_id", projectId)
        .eq("priority", "must")
        .order("sort_order", { ascending: true }),
    ])

  if (!project) throw new Error("Project not found")
  if (!req) throw new Error("Requirements missing — finish Discover first")

  const mustFeatures = (features ?? []) as Feature[]
  if (mustFeatures.length === 0) {
    throw new Error("Add at least one Must Have feature before creating design flows")
  }

  const design = await generateDesign(
    projectId,
    (project as Project).idea,
    req as Requirements,
    mustFeatures,
  )

  const { error } = await db
    .from("projects")
    .update({ product_design: design })
    .eq("id", projectId)
  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  return design
}

export async function saveProductDesign(
  projectId: string,
  design: ProductDesign,
): Promise<ProductDesign> {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from("projects")
    .update({ product_design: design })
    .eq("id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
  return design
}

export async function updateFeaturePriority(
  featureId: string,
  projectId: string,
  priority: FeaturePriority,
) {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from("features")
    .update({ priority })
    .eq("id", featureId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

export async function updateFeatureText(
  featureId: string,
  projectId: string,
  fields: { name?: string; reasoning?: string },
) {
  const db = getSupabaseAdmin()
  const patch: { name?: string; reasoning?: string } = {}
  if (fields.name !== undefined) patch.name = fields.name.trim()
  if (fields.reasoning !== undefined) patch.reasoning = fields.reasoning.trim()
  if (Object.keys(patch).length === 0) return

  const { error } = await db
    .from("features")
    .update(patch)
    .eq("id", featureId)
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

function orderFeaturesByDependencies(
  features: Feature[],
  cards: Array<{ feature_id: string | null; dependencies: string[] }>,
): Feature[] {
  if (features.length <= 1) return features

  const byId = new Map(features.map((f) => [f.id, f]))
  const cardByFeature = new Map(
    cards
      .filter((c) => c.feature_id)
      .map((c) => [c.feature_id as string, c]),
  )
  const nameToId = new Map(
    features.map((f) => [f.name.trim().toLowerCase(), f.id]),
  )

  const inDegree = new Map(features.map((f) => [f.id, 0]))
  const dependents = new Map(features.map((f) => [f.id, [] as string[]]))

  for (const feature of features) {
    const card = cardByFeature.get(feature.id)
    for (const depName of card?.dependencies ?? []) {
      const depId = nameToId.get(depName.trim().toLowerCase())
      if (!depId || depId === feature.id || !byId.has(depId)) continue
      dependents.get(depId)!.push(feature.id)
      inDegree.set(feature.id, (inDegree.get(feature.id) ?? 0) + 1)
    }
  }

  const sorted = [...features].sort((a, b) => a.sort_order - b.sort_order)
  const queue = sorted.filter((f) => (inDegree.get(f.id) ?? 0) === 0)
  const ordered: Feature[] = []

  while (queue.length > 0) {
    const next = queue.shift()!
    ordered.push(next)
    for (const childId of dependents.get(next.id) ?? []) {
      const nextDegree = (inDegree.get(childId) ?? 0) - 1
      inDegree.set(childId, nextDegree)
      if (nextDegree === 0) {
        queue.push(byId.get(childId)!)
        queue.sort((a, b) => a.sort_order - b.sort_order)
      }
    }
  }

  if (ordered.length < features.length) {
    for (const f of sorted) {
      if (!ordered.some((o) => o.id === f.id)) ordered.push(f)
    }
  }

  return ordered
}

async function persistFeatureOrder(projectId: string, ordered: Feature[]) {
  const db = getSupabaseAdmin()
  await Promise.all(
    ordered.map((feature, index) =>
      db
        .from("features")
        .update({ sort_order: index })
        .eq("id", feature.id)
        .eq("project_id", projectId),
    ),
  )
}

export async function updateFeatureSortOrder(
  projectId: string,
  orderedFeatureIds: string[],
): Promise<Feature[]> {
  const db = getSupabaseAdmin()
  const { data: features, error } = await db
    .from("features")
    .select("*")
    .eq("project_id", projectId)
    .eq("priority", "must")

  if (error) throw new Error(error.message)

  const must = (features ?? []) as Feature[]
  if (orderedFeatureIds.length !== must.length) {
    throw new Error("Ordered feature list must include all must-have features")
  }

  const mustIds = new Set(must.map((f) => f.id))
  for (const id of orderedFeatureIds) {
    if (!mustIds.has(id)) throw new Error("Invalid feature in sort order")
  }

  await Promise.all(
    orderedFeatureIds.map((id, index) =>
      db
        .from("features")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("project_id", projectId),
    ),
  )

  revalidatePath(`/projects/${projectId}`)
  return orderedFeatureIds
    .map((id) => must.find((f) => f.id === id)!)
    .map((f, index) => ({ ...f, sort_order: index }))
}

export async function updateFoundationPrompt(
  projectId: string,
  foundation_prompt: string,
): Promise<Project> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("projects")
    .update({ foundation_prompt })
    .eq("id", projectId)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
  return data as Project
}

export async function generateAndSaveFoundationPrompt(
  projectId: string,
): Promise<string> {
  const db = getSupabaseAdmin()
  const [{ data: req }, { data: features }] = await Promise.all([
    db.from("requirements").select("*").eq("project_id", projectId).single(),
    db
      .from("features")
      .select("*")
      .eq("project_id", projectId)
      .eq("priority", "must")
      .order("sort_order", { ascending: true }),
  ])

  if (!req) throw new Error("Requirements missing")

  const mustFeatures = (features ?? []) as Feature[]
  const prompt = await generateFoundationPrompt(
    req as RequirementsDraft,
    mustFeatures.map((f) => ({
      name: f.name,
      priority: f.priority,
      reasoning: f.reasoning,
    })),
  )

  const { error } = await db
    .from("projects")
    .update({ foundation_prompt: prompt })
    .eq("id", projectId)
  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  return prompt
}

export async function updateFeatureVerify(
  featureId: string,
  projectId: string,
  verify: string,
) {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from("features")
    .update({ verify })
    .eq("id", featureId)
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

export async function updateCardAiPrompt(
  cardId: string,
  projectId: string,
  ai_prompt: string,
) {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from("cards")
    .update({ ai_prompt })
    .eq("id", cardId)
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

/* ------------------------------ Cards ----------------------------- */

export interface BlueprintSaveResult {
  cards: TaskCard[]
  features: Feature[]
  foundation_prompt: string
  database_schema: string
}

export async function generateAndSaveCards(
  projectId: string,
): Promise<BlueprintSaveResult> {
  const tier = resolveBillingTier()
  const [blueprintProjects, hasBlueprint] = await Promise.all([
    countBlueprintProjects(),
    projectHasBlueprint(projectId),
  ])
  if (!canCreateBlueprint(tier, blueprintProjects, hasBlueprint)) {
    throw new Error(TIER_MESSAGES.blueprintLimit)
  }

  const db = getSupabaseAdmin()
  const [{ data: projectRow }, { data: req }, { data: allFeaturesData }] =
    await Promise.all([
      db.from("projects").select("*").eq("id", projectId).single(),
      db.from("requirements").select("*").eq("project_id", projectId).single(),
      db
        .from("features")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
    ])

  if (!projectRow) throw new Error("Project not found")
  if (!req) throw new Error("Requirements missing")

  const project = projectRow as Project
  const design = project.product_design ?? null
  if (!design) throw new Error("Design missing — create design flows first")

  const allFeatures = ((allFeaturesData ?? []) as Feature[]).map((f) => ({
    ...f,
    verify: f.verify ?? "",
  }))
  const mustFeatures = allFeatures.filter((f) => f.priority === "must")
  if (mustFeatures.length === 0)
    throw new Error("Add at least one Must Have feature first")

  const schemaBlueprint = deriveSchemaBlueprint(design, mustFeatures)
  const database_schema = [
    schemaBlueprint.markdown.trim(),
    "",
    "### AI prompt snippet",
    "",
    schemaBlueprint.promptSnippet.trim(),
  ].join("\n")

  await db.from("cards").delete().eq("project_id", projectId)

  const batch = await generateBlueprintBatch({
    idea: project.idea,
    req: req as RequirementsDraft,
    mustFeatures: mustFeatures.map((f) => ({
      name: f.name,
      priority: f.priority,
      reasoning: f.reasoning,
    })),
    allFeatures,
    design,
    schemaBlueprint,
  })

  const itemByName = new Map(
    batch.items.map((item) => [item.title.trim().toLowerCase(), item]),
  )

  let order = 0
  const rows: Array<Record<string, unknown>> = []
  const featureUpdates: Array<{ id: string; verify: string }> = []

  for (const feature of mustFeatures) {
    const item = itemByName.get(feature.name.trim().toLowerCase())
    if (!item) {
      throw new Error(
        `Blueprint generation missed feature "${feature.name}". Try again.`,
      )
    }
    const designScreens = screensForFeature(design, feature.id)
    const cardScreens =
      item.screens.length > 0 ? item.screens : designScreens

    rows.push({
      feature_id: feature.id,
      project_id: projectId,
      card_type: "feature",
      title: feature.name,
      goal: item.goal,
      screens: cardScreens,
      acceptance_criteria: item.acceptance_criteria,
      test_steps: item.test_steps,
      dependencies: item.dependencies ?? [],
      subtasks: item.acceptance_criteria,
      ai_prompt: item.ai_prompt,
      resource_query: item.resource_query,
      how_to_build: item.how_to_build,
      how_to_test: item.test_steps.join(". "),
      user_journey: userJourneyForFeature(design, feature.id),
      success_criteria: item.acceptance_criteria,
      deferred_stages: [],
      status: order === 0 ? "in_progress" : "todo",
      sort_order: order++,
    })
    featureUpdates.push({ id: feature.id, verify: item.verify })
  }

  await db
    .from("projects")
    .update({
      foundation_prompt: batch.foundation_prompt,
      database_schema,
    })
    .eq("id", projectId)

  await Promise.all(
    featureUpdates.map(({ id, verify }) =>
      db.from("features").update({ verify }).eq("id", id),
    ),
  )

  const orderedFeatures = orderFeaturesByDependencies(
    mustFeatures,
    rows.map((row) => ({
      feature_id: row.feature_id as string,
      dependencies: row.dependencies as string[],
    })),
  )
  await persistFeatureOrder(projectId, orderedFeatures)

  const { data, error } = await db.from("cards").insert(rows).select("*")
  if (error) {
    if (/schema cache|could not find the/i.test(error.message)) {
      throw new Error(
        "Database schema out of date. Run scripts/migrations/migrate-all.sql in your Supabase SQL editor, then try again.",
      )
    }
    throw new Error(error.message)
  }

  await setStage(projectId, "tasks")
  revalidatePath(`/projects/${projectId}`)

  const { data: updatedFeatures } = await db
    .from("features")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  const cards = ((data ?? []) as TaskCard[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(normalizeCard)

  return {
    cards,
    features: ((updatedFeatures ?? []) as Feature[]).map((f) => ({
      ...f,
      verify: f.verify ?? "",
    })),
    foundation_prompt: batch.foundation_prompt,
    database_schema,
  }
}

export async function updateCardStatus(
  cardId: string,
  projectId: string,
  status: CardStatus,
) {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from("cards")
    .update({ status })
    .eq("id", cardId)
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}
