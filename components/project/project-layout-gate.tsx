"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { needsOnboarding, discoverPath } from "@/lib/journey/onboarding"
import { useProject } from "./project-context"
import { OnboardingShell } from "./onboarding-shell"
import { ProjectShell } from "./project-shell"

export function ProjectLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { bundle } = useProject()
  const onboarding = needsOnboarding(bundle)
  const chatPath = discoverPath(bundle.project.id)

  useEffect(() => {
    if (!onboarding) return
    if (pathname === chatPath || pathname.startsWith(`${chatPath}/`)) return
    router.replace(chatPath)
  }, [onboarding, pathname, router, chatPath])

  if (onboarding) {
    return <OnboardingShell>{children}</OnboardingShell>
  }

  return <ProjectShell>{children}</ProjectShell>
}
