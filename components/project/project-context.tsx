"use client"

import { createContext, useContext, useState } from "react"
import type { ProjectBundle } from "@/app/actions/projects"

const ProjectContext = createContext<{
  bundle: ProjectBundle
  setBundle: React.Dispatch<React.SetStateAction<ProjectBundle>>
} | null>(null)

export function ProjectProvider({
  initial,
  children,
}: {
  initial: ProjectBundle
  children: React.ReactNode
}) {
  const [bundle, setBundle] = useState(initial)
  return (
    <ProjectContext.Provider value={{ bundle, setBundle }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProject must be used within ProjectProvider")
  return ctx
}
