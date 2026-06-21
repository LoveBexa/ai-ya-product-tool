import type { ProjectBundle } from "@/app/actions/projects"
import type { Project } from "@/lib/types"
import { isDiscoveryComplete } from "./prerequisites"

/** True until the user generates requirements (chat → Define handoff). */
export function needsOnboarding(bundle: ProjectBundle): boolean {
  return !isDiscoveryComplete(bundle)
}

export function discoverPath(projectId: string): string {
  return `/projects/${projectId}/discover`
}

/** Start / project list — open onboarding chat vs main workspace. */
export function projectContinueHref(project: Project): string {
  if (project.stage === "discovery") {
    return discoverPath(project.id)
  }
  return `/projects/${project.id}`
}
