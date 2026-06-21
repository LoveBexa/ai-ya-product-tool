import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function countProjects(userId?: string): Promise<number> {
  const db = getSupabaseAdmin()
  let query = db.from("projects").select("*", { count: "exact", head: true })
  if (userId) query = query.eq("user_id", userId)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Distinct projects that already have blueprint cards (any row in cards). */
export async function countBlueprintProjects(userId?: string): Promise<number> {
  const db = getSupabaseAdmin()

  if (userId) {
    const { data: owned, error: ownedError } = await db
      .from("projects")
      .select("id")
      .eq("user_id", userId)
    if (ownedError) throw new Error(ownedError.message)
    const ids = (owned ?? []).map((row) => row.id as string)
    if (ids.length === 0) return 0

    const { data, error } = await db
      .from("cards")
      .select("project_id")
      .in("project_id", ids)
    if (error) throw new Error(error.message)
    return new Set((data ?? []).map((row) => row.project_id as string)).size
  }

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
