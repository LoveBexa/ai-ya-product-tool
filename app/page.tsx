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
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Turn an idea into a{" "}
            <span className="serif-accent">build plan</span>
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Your AI business analyst interviews you, writes the requirements,
            cuts an MVP, and breaks it into executable task cards.
          </p>
        </div>

        {!configured && <SetupNotice className="mb-8" />}

        <IdeaIntake />

        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Your <span className="serif-accent">projects</span>
          </h2>

          {loadError && (
            <p className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
              {loadError}
            </p>
          )}

          {configured && !loadError && projects.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              No projects yet. Describe an idea above to get started.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
