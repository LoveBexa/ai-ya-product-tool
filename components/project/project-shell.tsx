"use client"

import { usePathname } from "next/navigation"
import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"
import { AccountMenu } from "./account-menu"
import { ProjectBottomBar } from "./project-bottom-bar"
import { PhaseNav } from "./phase-nav"
import { useProject } from "./project-context"

export function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { bundle } = useProject()
  const lockViewport = /\/discover(?:\/|$)/.test(pathname)

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        lockViewport && "h-dvh overflow-hidden",
      )}
    >
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark href="/start" showTagline={false} />
          <AccountMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main
          className={cn(
            "flex min-h-0 w-full flex-1 flex-col",
            lockViewport
              ? "overflow-hidden px-4 py-3 sm:px-6 lg:px-8"
              : "px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-6",
          )}
        >
          <div
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col",
              lockViewport && "overflow-hidden",
            )}
          >
            {children}
          </div>
          {!lockViewport && <PhaseNav projectId={bundle.project.id} />}
        </main>
      </div>

      <ProjectBottomBar projectId={bundle.project.id} />
    </div>
  )
}
