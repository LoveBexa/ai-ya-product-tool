import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function countProjects(): Promise<number> {
  const db = getSupabaseAdmin()
  const { count, error } = await db
    .from("projects")
    .select("*", { count: "exact", head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Distinct projects that already have blueprint cards (any row in cards). */
export async function countBlueprintProjects(): Promise<number> {
  const db = getSupabaseAdmin()
  const { data, error } = await db.from("cards").select("project_id")
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row) => row.project_id as string)).size
}

export async function projectHasBlueprint(projectId: string): Promise<boolean> {
  const db = getSupabaseAdmin()
  const { count, error } = await db
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  return (count ?? 0) > 0
}
