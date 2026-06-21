import { AppShell } from "@/components/app-shell"
import { IdeaIntake } from "@/components/home/idea-intake"
import { ProjectListCard } from "@/components/home/project-list-card"
import { TierPlanBadge } from "@/components/billing/tier-notice"
import { SetupNotice } from "@/components/setup-notice"
import type { TierUsageSnapshot } from "@/app/actions/billing"
import type { Profile, Project } from "@/lib/types"

export function ProjectsHome({
  configured,
  projects,
  loadError,
  tierUsage,
  profile = null,
}: {
  configured: boolean
  projects: Project[]
  loadError: string | null
  tierUsage: TierUsageSnapshot | null
  profile?: Profile | null
}) {
  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {!configured && <SetupNotice className="mb-10" />}

        {tierUsage &&
          (tierUsage.tier === "paid" || tierUsage.canCreateProject) && (
            <div className="mb-10 flex justify-center">
              <TierPlanBadge tierUsage={tierUsage} />
            </div>
          )}

        <IdeaIntake tierUsage={tierUsage} />

        {(loadError || projects.length > 0) && (
          <>
            <div
              className="mt-16 border-t border-border/50 sm:mt-20"
              aria-hidden
            />

            <section className="pt-6 sm:pt-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your projects
              </h2>

              {loadError && (
                <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
                  {loadError}
                </p>
              )}

              {configured && !loadError && projects.length > 0 && (
                <ul className="mt-5 flex flex-col gap-3">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <ProjectListCard project={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
