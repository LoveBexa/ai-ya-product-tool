"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import {
  generateRequirements,
  generateFeatures,
  generateCards,
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

export interface ProjectBundle {
  project: Project
  requirements: Requirements | null
  features: Feature[]
  cards: TaskCard[]
}

/* ---------------------------- Projects ---------------------------- */

export async function createProject(idea: string): Promise<string> {
  const db = getSupabaseAdmin()
  const title = idea.trim().slice(0, 60) || "Untitled idea"
  const { data, error } = await db
    .from("projects")
    .insert({ title, idea: idea.trim(), stage: "discovery", chat: [] })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/")
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
    project: project as Project,
    requirements: (req ?? null) as Requirements | null,
    features: (features ?? []) as Feature[],
    cards: (cards ?? []) as TaskCard[],
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

export async function updateRequirements(
  projectId: string,
  fields: RequirementsDraft,
): Promise<Requirements> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("requirements")
    .update(fields)
    .eq("project_id", projectId)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
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

/* ------------------------------ Cards ----------------------------- */

export async function generateAndSaveCards(
  projectId: string,
): Promise<TaskCard[]> {
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

  // Fresh generate: clear existing cards for this project.
  await db.from("cards").delete().eq("project_id", projectId)

  let order = 0
  const rows: Array<Record<string, unknown>> = []
  for (const feature of mustFeatures) {
    const cards = await generateCards(
      feature.name,
      feature.reasoning,
      req as RequirementsDraft,
    )
    for (const c of cards) {
      rows.push({
        feature_id: feature.id,
        project_id: projectId,
        title: c.title,
        goal: c.goal,
        subtasks: c.subtasks,
        ai_prompt: c.ai_prompt,
        resource_query: c.resource_query,
        status: "todo",
        sort_order: order++,
      })
    }
  }

  const { data, error } = await db.from("cards").insert(rows).select("*")
  if (error) throw new Error(error.message)

  await setStage(projectId, "tasks")
  revalidatePath(`/projects/${projectId}`)
  return ((data ?? []) as TaskCard[]).sort((a, b) => a.sort_order - b.sort_order)
}

export async function updateCardStatus(
  cardId: string,
  projectId: string,
  status: CardStatus,
) {
  const db = getSupabaseAdmin()
  const { error } = await db.from("cards").update({ status }).eq("id", cardId)
  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}
