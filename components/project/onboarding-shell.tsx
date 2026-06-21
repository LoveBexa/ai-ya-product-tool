"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { DeleteProjectTrigger } from "@/components/project/delete-project-trigger"
import { markDiscoverySkipped } from "@/lib/journey/onboarding-skip"
import { useProject } from "./project-context"
import { ProjectBottomBar } from "./project-bottom-bar"

/** Focused discover chat — no sidebar, journey bar always visible. */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const { bundle } = useProject()
  const router = useRouter()
  const { id, title } = bundle.project

  function skipForNow() {
    markDiscoverySkipped(id)
    router.push(`/projects/${id}`)
  }

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <Link
            href="/start"
            className="inline-flex min-w-0 max-w-[42%] items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:max-w-none"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Back to projects</span>
          </Link>

          <BrandMark href="/start" showTagline={false} compact className="hidden sm:flex" />

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={skipForNow}
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:text-sm"
            >
              Skip for now
            </button>
            <DeleteProjectTrigger
              projectId={id}
              projectTitle={title}
              variant="compact"
            />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 pb-2 sm:px-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col">
          {children}
        </div>
      </main>

      <ProjectBottomBar
        projectId={bundle.project.id}
        onboarding
        alwaysVisible
      />
    </div>
  )
}
