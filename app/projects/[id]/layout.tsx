import { notFound } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProjectProvider } from "@/components/project/project-context"
import { ProjectShell } from "@/components/project/project-shell"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { getProjectBundle } from "@/app/actions/projects"

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
  try {
    bundle = await getProjectBundle(id)
  } catch (e) {
    if (e instanceof Error && /not found/i.test(e.message)) {
      notFound()
    }
    throw e
  }

  return (
    <AppShell showHeader={false}>
      <ProjectProvider initial={bundle}>
        <ProjectShell>{children}</ProjectShell>
      </ProjectProvider>
    </AppShell>
  )
}
