import { ProjectsHome } from "@/components/home/projects-home"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { listProjects } from "@/app/actions/projects"
import type { Project } from "@/lib/types"

export const metadata = {
  title: "Start a project — AIYA",
  description: "Describe your idea and start your product journey with AIYA.",
}

export default async function StartPage() {
  const configured = isSupabaseConfigured()
  let projects: Project[] = []
  let loadError: string | null = null

  if (configured) {
    try {
      projects = await listProjects()
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Failed to load projects."
    }
  }

  return (
    <ProjectsHome
      configured={configured}
      projects={projects}
      loadError={loadError}
    />
  )
}
