"use client"

import { createContext, useContext, useState } from "react"
import type { ProjectBundle } from "@/app/actions/projects"
import type { Project } from "@/lib/types"

const ProjectContext = createContext<{
  bundle: ProjectBundle
  setBundle: React.Dispatch<React.SetStateAction<ProjectBundle>>
  projects: Project[]
} | null>(null)

export function ProjectProvider({
  initial,
  projects,
  children,
}: {
  initial: ProjectBundle
  projects: Project[]
  children: React.ReactNode
}) {
  const [bundle, setBundle] = useState(initial)
  return (
    <ProjectContext.Provider value={{ bundle, setBundle, projects }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProject must be used within ProjectProvider")
  return ctx
}
