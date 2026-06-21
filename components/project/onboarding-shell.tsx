"use client"

import { BrandMark } from "@/components/brand-mark"
import { useProject } from "./project-context"
import { ProjectBottomBar } from "./project-bottom-bar"

/** Focused discover chat — no sidebar, journey bar always visible. */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const { bundle } = useProject()

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl justify-center">
          <BrandMark href="/start" showTagline={false} />
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
