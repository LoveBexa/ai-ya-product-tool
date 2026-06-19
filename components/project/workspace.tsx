"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectBundle } from "@/app/actions/projects"
import type { ProjectStage } from "@/lib/types"
import { DiscoveryChat } from "./discovery-chat"
import { RequirementsView } from "./requirements-view"
import { MvpBoard } from "./mvp-board"
import { KanbanBoard } from "./kanban-board"

const STEPS: { key: ProjectStage; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "requirements", label: "Requirements" },
  { key: "mvp", label: "MVP cut" },
  { key: "tasks", label: "Task board" },
]

const ORDER: ProjectStage[] = ["discovery", "requirements", "mvp", "tasks"]

export function Workspace({ initial }: { initial: ProjectBundle }) {
  const [bundle, setBundle] = useState<ProjectBundle>(initial)
  const [view, setView] = useState<ProjectStage>(initial.project.stage)

  const reached: Record<ProjectStage, boolean> = {
    discovery: true,
    requirements: !!bundle.requirements,
    mvp: bundle.features.length > 0,
    tasks: bundle.cards.length > 0,
  }

  function goTo(stage: ProjectStage) {
    if (reached[stage]) setView(stage)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-3">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
        <h1 className="text-balance text-xl font-semibold tracking-tight">
          {bundle.project.title}
        </h1>
      </div>

      {/* Stepper */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5">
        {STEPS.map((step, i) => {
          const isActive = view === step.key
          const isReached = reached[step.key]
          const isDone = ORDER.indexOf(bundle.project.stage) > i || (isReached && !isActive)
          return (
            <button
              key={step.key}
              onClick={() => goTo(step.key)}
              disabled={!isReached}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : isReached
                    ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    : "cursor-not-allowed text-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDone
                      ? "border-primary/50 text-primary"
                      : "border-border",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {step.label}
            </button>
          )
        })}
      </nav>

      {view === "discovery" && (
        <DiscoveryChat
          bundle={bundle}
          onRequirements={(requirements) => {
            setBundle((b) => ({
              ...b,
              requirements,
              project: { ...b.project, stage: "requirements" },
            }))
            setView("requirements")
          }}
        />
      )}

      {view === "requirements" && bundle.requirements && (
        <RequirementsView
          projectId={bundle.project.id}
          requirements={bundle.requirements}
          onChange={(requirements) =>
            setBundle((b) => ({ ...b, requirements }))
          }
          onFeatures={(features) => {
            setBundle((b) => ({
              ...b,
              features,
              project: { ...b.project, stage: "mvp" },
            }))
            setView("mvp")
          }}
        />
      )}

      {view === "mvp" && (
        <MvpBoard
          projectId={bundle.project.id}
          features={bundle.features}
          onChange={(features) => setBundle((b) => ({ ...b, features }))}
          onCards={(cards) => {
            setBundle((b) => ({
              ...b,
              cards,
              project: { ...b.project, stage: "tasks" },
            }))
            setView("tasks")
          }}
        />
      )}

      {view === "tasks" && (
        <KanbanBoard
          projectId={bundle.project.id}
          features={bundle.features}
          cards={bundle.cards}
          onChange={(cards) => setBundle((b) => ({ ...b, cards }))}
        />
      )}
    </div>
  )
}
