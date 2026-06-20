import { ProjectsHome } from "@/components/home/projects-home"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { listProjects } from "@/app/actions/projects"
import { getTierUsage } from "@/app/actions/billing"
import type { Project } from "@/lib/types"

export const metadata = {
  title: "Start a project — AIYA",
  description: "Describe your idea and start your product journey with AIYA.",
}

export default async function StartPage() {
  const configured = isSupabaseConfigured()
  let projects: Project[] = []
  let loadError: string | null = null
  let tierUsage = null

  if (configured) {
    try {
      ;[projects, tierUsage] = await Promise.all([
        listProjects(),
        getTierUsage(),
      ])
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Failed to load projects."
    }
  }

  return (
    <ProjectsHome
      configured={configured}
      projects={projects}
      loadError={loadError}
      tierUsage={tierUsage}
    />
  )
}
