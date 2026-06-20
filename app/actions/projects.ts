"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import {
  generateRequirements,
  generateFeatures,
  generateQueueItem,
  generateFoundationPrompt,
} from "@/lib/ai/generate"
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
import { DELETE_CONFIRMATION_PHRASE } from "@/lib/projects/constants"

export interface ProjectBundle {
  project: Project
  requirements: Requirements | null
  features: Feature[]
  cards: TaskCard[]
}

/* ---------------------------- Projects ---------------------------- */

export async function createProject(idea: string): Promise<string> {
  const db = getSupabaseAdmin()
  const title = idea.trim().slice(0, 120) || "Untitled idea"
  const { data, error } = await db
    .from("projects")
    .insert({ title, idea: idea.trim(), stage: "discovery", chat: [] })
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
  return (data ?? []) as Project[]
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

export async function updateProjectTitle(
  projectId: string,
  title: string,
): Promise<Project> {
  const trimmed = title.trim().slice(0, 120) || "Untitled idea"
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("projects")
    .update({ title: trimmed })
    .eq("id", projectId)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/start")
  revalidatePath(`/projects/${projectId}`)
  return {
    ...(data as Project),
    foundation_prompt: (data as Project).foundation_prompt ?? "",
    database_schema: (data as Project).database_schema ?? "",
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

  return {
    project: {
      ...(project as Project),
      foundation_prompt: (project as Project).foundation_prompt ?? "",
      database_schema: (project as Project).database_schema ?? "",
    },
    requirements: (req ?? null) as Requirements | null,
    features: ((features ?? []) as Feature[]).map((f) => ({
      ...f,
      verify: f.verify ?? "",
    })),
    cards: ((cards ?? []) as TaskCard[]).map(normalizeCard),
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

export async function generateAndSaveCards(
  projectId: string,
): Promise<{ cards: TaskCard[]; features: Feature[] }> {
  const db = getSupabaseAdmin()
  const { data: req } = await db
    .from("requirements")
    .select("*")
    .eq("project_id", projectId)
    .single()
  if (!req) throw new Error("Requirements missing")

  const { data: features } = await db
    .from("features")
    .select("*")
    .eq("project_id", projectId)
    .eq("priority", "must")
    .order("sort_order", { ascending: true })

  const mustFeatures = (features ?? []) as Feature[]
  if (mustFeatures.length === 0)
    throw new Error("Add at least one Must Have feature first")

  await db.from("cards").delete().eq("project_id", projectId)

  let order = 0
  const rows: Array<Record<string, unknown>> = []

  for (const feature of mustFeatures) {
    const item = await generateQueueItem(
      feature.name,
      feature.reasoning,
      req as RequirementsDraft,
    )
    rows.push({
      feature_id: feature.id,
      project_id: projectId,
      card_type: "feature",
      title: feature.name,
      goal: item.goal,
      screens: item.screens ?? [],
      acceptance_criteria: item.acceptance_criteria,
      test_steps: item.test_steps,
      dependencies: item.dependencies ?? [],
      subtasks: item.acceptance_criteria,
      ai_prompt: item.ai_prompt,
      resource_query: item.resource_query,
      how_to_build: item.how_to_build,
      how_to_test: item.test_steps.join(". "),
      user_journey: "",
      success_criteria: [],
      deferred_stages: [],
      status: order === 0 ? "in_progress" : "todo",
      sort_order: order++,
    })

    await db
      .from("features")
      .update({ verify: item.verify })
      .eq("id", feature.id)
  }

  const orderedFeatures = orderFeaturesByDependencies(
    mustFeatures,
    rows.map((row) => ({
      feature_id: row.feature_id as string,
      dependencies: row.dependencies as string[],
    })),
  )
  await persistFeatureOrder(projectId, orderedFeatures)

  const { data, error } = await db.from("cards").insert(rows).select("*")
  if (error) throw new Error(error.message)

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
