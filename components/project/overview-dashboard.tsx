"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Circle, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateAndSaveCards, updateProjectTitle } from "@/app/actions/projects"
import { getJourneySteps, hasExecutePlan } from "@/lib/journey/status"
import { PIPELINE_STOPS } from "@/lib/journey/navigation"
import { STAGES } from "@/lib/journey/specialists"
import { useProject } from "./project-context"
import { DeleteProject } from "./delete-project"
import { Input } from "@/components/ui/input"
import type { StepState } from "@/lib/journey/status"

function StepRow({ state, label }: { state: StepState; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {state === "done" && <Check className="h-4 w-4 shrink-0 text-success" />}
      {state === "current" && <Clock className="h-4 w-4 shrink-0 text-warning" />}
      {state === "upcoming" && (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      <span
        className={cn(
          state === "upcoming" && "text-muted-foreground",
          state === "current" && "font-medium",
        )}
      >
        {label}
      </span>
    </li>
  )
}

export function OverviewDashboard() {
  const router = useRouter()
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const [generating, setGenerating] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  const journey = getJourneySteps(bundle)
  const planReady = hasExecutePlan(bundle)

  function patchTitle(title: string) {
    setBundle((b) => ({
      ...b,
      project: { ...b.project, title },
    }))
  }

  async function saveTitle(title: string) {
    const trimmed = title.trim() || "Untitled idea"
    const previous = bundle.project.title
    patchTitle(trimmed)
    setTitleError(null)
    try {
      await updateProjectTitle(projectId, trimmed)
      router.refresh()
    } catch {
      patchTitle(previous)
      setTitleError("Couldn't save name. Try again.")
    }
  }

  async function generateExecutePlan() {
    setGenerating(true)
    setPlanError(null)
    try {
      const { cards, features } = await generateAndSaveCards(projectId)
      setBundle((b) => ({
        ...b,
        cards,
        features,
        project: { ...b.project, stage: "tasks" },
      }))
      router.push(`/projects/${projectId}/execute`)
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Blueprint creation failed.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-4 lg:gap-6">
      <header>
        <Input
          value={bundle.project.title}
          onChange={(e) => patchTitle(e.target.value)}
          onBlur={(e) => saveTitle(e.target.value)}
          aria-label="Project name"
          className="h-auto rounded-xl border-border/40 bg-transparent px-2 py-1.5 text-2xl font-semibold leading-tight tracking-tight shadow-none focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-ring/40 sm:text-3xl"
        />
        {titleError && (
          <p className="mt-1 px-2 text-xs text-warning">{titleError}</p>
        )}
        <p className="mt-1 px-2 text-sm text-muted-foreground">
          {bundle.project.idea}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Where am I?
        </p>
        <ul className="mt-3 space-y-2">
          <StepRow state={journey.discover} label={journey.discoverLabel} />
          <StepRow state={journey.define} label={journey.defineLabel} />
          <StepRow state={journey.design} label={journey.designLabel} />
          <StepRow state={journey.execute} label={journey.executeLabel} />
        </ul>

        {planReady && (
          <Link
            href={`/projects/${projectId}/execute`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open blueprint <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {!planReady && journey.design === "done" && (
          <>
            <button
              type="button"
              onClick={generateExecutePlan}
              disabled={generating}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create blueprint <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            {planError && (
              <p className="mt-2 text-xs text-warning">{planError}</p>
            )}
          </>
        )}
        {journey.design === "current" && journey.define === "done" && (
          <Link
            href={`/projects/${projectId}/design`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Hand off to UX Designer <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {journey.discover === "current" && (
          <Link
            href={`/projects/${projectId}/discover`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Start discovering <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {journey.define === "current" && journey.discover === "done" && (
          <Link
            href={`/projects/${projectId}/define`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Hand off to Product Manager <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          The pipeline
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          AIYA helps you avoid building the wrong software — not how to code,
          but what to ship first and what to build next.
        </p>
        <ol className="mt-3 space-y-2">
          {PIPELINE_STOPS.map((key, i, arr) => (
            <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-foreground">{STAGES[key].role}</span>
                {" · "}
                {STAGES[key].subtitle}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </section>

      <DeleteProject projectId={projectId} projectTitle={bundle.project.title} />
    </div>
  )
}
