import { notFound } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProjectProvider } from "@/components/project/project-context"
import { ProjectLayoutGate } from "@/components/project/project-layout-gate"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { getProjectBundle, listProjects } from "@/app/actions/projects"

/** AI server actions (blueprint, design, etc.) can run 30–60s. */
export const maxDuration = 60

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
          <h1 className="text-xl font-semibold">Database not connected</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your Supabase environment variables to open saved projects.
          </p>
        </div>
      </AppShell>
    )
  }

  let bundle
  let projects
  try {
    ;[bundle, projects] = await Promise.all([
      getProjectBundle(id),
      listProjects(),
    ])
  } catch (e) {
    if (e instanceof Error && /not found/i.test(e.message)) {
      notFound()
    }
    throw e
  }

  return (
    <AppShell showHeader={false}>
      <ProjectProvider initial={bundle} projects={projects}>
        <ProjectLayoutGate>{children}</ProjectLayoutGate>
      </ProjectProvider>
    </AppShell>
  )
}
