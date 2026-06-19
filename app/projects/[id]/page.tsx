import { notFound } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Workspace } from "@/components/project/workspace"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { getProjectBundle } from "@/app/actions/projects"

export default async function ProjectPage({
  params,
}: {
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
  } catch {
    notFound()
  }

  return (
    <AppShell>
      <Workspace initial={bundle} />
    </AppShell>
  )
}
