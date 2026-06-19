import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { IdeaIntake } from "@/components/home/idea-intake"
import { StageBadge } from "@/components/stage-badge"
import { SetupNotice } from "@/components/setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { listProjects } from "@/app/actions/projects"
import type { Project } from "@/lib/types"

export default async function HomePage() {
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
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn an idea into a build plan
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Your AI business analyst interviews you, writes the requirements,
            cuts an MVP, and breaks it into executable task cards.
          </p>
        </div>

        {!configured && <SetupNotice className="mb-8" />}

        <IdeaIntake />

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Your projects
          </h2>

          {loadError && (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-warning">
              {loadError}
            </p>
          )}

          {configured && !loadError && projects.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No projects yet. Describe an idea above to get started.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.idea}
                    </p>
                  </div>
                  <StageBadge stage={p.stage} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
