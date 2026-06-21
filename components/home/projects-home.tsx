import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { IdeaIntake } from "@/components/home/idea-intake"
import { TierPlanBadge } from "@/components/billing/tier-notice"
import { SetupNotice } from "@/components/setup-notice"
import { cn } from "@/lib/utils"
import {
  blueprintProgress,
  blueprintProgressLabel,
  resolveProjectEmoji,
  relativeLastEdited,
} from "@/lib/home/project-card-meta"
import { projectContinueHref } from "@/lib/journey/onboarding"
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
                  {projects.map((p) => {
                    const progress = blueprintProgress(p)
                    const progressLabel = blueprintProgressLabel(progress)

                    return (
                      <li key={p.id}>
                        <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.15)] transition-shadow hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.2)]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                <span aria-hidden className="mr-1.5">
                                  {resolveProjectEmoji(p)}
                                </span>
                                {p.title}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {relativeLastEdited(p.created_at)}
                              </p>
                              <p className="mt-2 text-xs font-medium text-foreground/80">
                                {progressLabel}: {progress}%
                              </p>
                              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-mint/50 bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-mint transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <Link
                              href={projectContinueHref(p)}
                              className={cn(
                                "inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-mint px-3.5 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90",
                              )}
                            >
                              Continue
                            </Link>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
