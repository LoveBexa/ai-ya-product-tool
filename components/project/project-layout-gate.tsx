"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { needsOnboarding, discoverPath } from "@/lib/journey/onboarding"
import { hasDiscoverySkipped } from "@/lib/journey/onboarding-skip"
import { useProject } from "./project-context"
import { OnboardingShell } from "./onboarding-shell"
import { ProjectShell } from "./project-shell"
import { WorkspaceFlow } from "./workspace-flow"
import type { Profile } from "@/lib/types"

export function ProjectLayoutGate({
  children,
  profile = null,
}: {
  children: React.ReactNode
  profile?: Profile | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { bundle } = useProject()
  const onboarding = needsOnboarding(bundle)
  const projectId = bundle.project.id
  const chatPath = discoverPath(projectId)
  const [skippedDiscovery, setSkippedDiscovery] = useState(false)

  useEffect(() => {
    setSkippedDiscovery(hasDiscoverySkipped(projectId))
  }, [projectId])

  const focusedOnboarding = onboarding && !skippedDiscovery

  useEffect(() => {
    if (!focusedOnboarding) return
    if (pathname === chatPath || pathname.startsWith(`${chatPath}/`)) return
    router.replace(chatPath)
  }, [focusedOnboarding, pathname, router, chatPath])

  if (focusedOnboarding) {
    return (
      <OnboardingShell>
        <WorkspaceFlow view="discover" />
      </OnboardingShell>
    )
  }

  return <ProjectShell profile={profile}>{children}</ProjectShell>
}
