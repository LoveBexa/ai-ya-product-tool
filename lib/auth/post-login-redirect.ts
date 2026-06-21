import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { projectContinueHref } from "@/lib/journey/onboarding"
import type { Project } from "@/lib/types"

const DEFAULT_POST_LOGIN = "/start"

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_POST_LOGIN
  }
  return next
}

/** Paths that should be replaced with the user's latest project when they have one. */
export function isDefaultPostLoginPath(path: string): boolean {
  return path === DEFAULT_POST_LOGIN || path === "/"
}

type ProjectRow = Pick<Project, "id" | "stage">

function toContinueHref(row: ProjectRow): string {
  return projectContinueHref(row as Project)
}

export function resolvePostLoginPath(
  projects: ProjectRow[],
  requestedNext: string,
): string {
  if (!isDefaultPostLoginPath(requestedNext)) {
    return requestedNext
  }
  const latest = projects[0]
  if (!latest) return DEFAULT_POST_LOGIN
  return toContinueHref(latest)
}

async function fetchLatestProject(
  db: SupabaseClient,
  userId: string,
): Promise<ProjectRow | null> {
  const { data, error } = await db
    .from("projects")
    .select("id, stage")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error || !data?.length) return null
  return data[0] as ProjectRow
}

export async function getPostLoginRedirectForUser(
  userId: string,
  requestedNext?: string | null,
  supabase?: SupabaseClient,
): Promise<string> {
  const next = sanitizeNextPath(requestedNext)
  if (!isDefaultPostLoginPath(next)) {
    return next
  }

  const db = supabase ?? getSupabaseAdmin()
  const latest = await fetchLatestProject(db, userId)
  if (!latest) return DEFAULT_POST_LOGIN
  return toContinueHref(latest)
}
