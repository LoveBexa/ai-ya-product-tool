import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { IdeaIntake } from "@/components/home/idea-intake"
import { TierPlanBadge } from "@/components/billing/tier-notice"
import { SetupNotice } from "@/components/setup-notice"
import { cn } from "@/lib/utils"
import type { TierUsageSnapshot } from "@/app/actions/billing"
import type { Project } from "@/lib/types"

function relativeCreated(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return "Created just now"
  if (hours < 24) return `Created ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Created yesterday"
  return `Created ${days}d ago`
}

export function ProjectsHome({
  configured,
  projects,
  loadError,
  tierUsage,
}: {
  configured: boolean
  projects: Project[]
  loadError: string | null
  tierUsage: TierUsageSnapshot | null
}) {
  return (
    <AppShell>
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
              className="mt-24 border-t border-border/50 sm:mt-32"
              aria-hidden
            />

            <section className="pt-10 sm:pt-12">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your projects
              </h2>

              {loadError && (
                <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
                  {loadError}
                </p>
              )}

              {configured && !loadError && projects.length > 0 && (
                <ul className="mt-5 flex flex-col gap-2">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-card/40 px-4 py-3 transition-colors hover:bg-card/80">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {p.idea}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">
                            {relativeCreated(p.created_at)}
                          </p>
                        </div>
                        <Link
                          href={`/projects/${p.id}`}
                          className={cn(
                            "inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-mint px-3.5 text-sm font-medium text-mint-foreground transition-opacity hover:opacity-90",
                          )}
                        >
                          Continue
                        </Link>
                      </div>
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
