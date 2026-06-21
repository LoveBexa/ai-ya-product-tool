"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateAndSaveCards, updateProjectTitle } from "@/app/actions/projects"
import { getTierUsage, type TierUsageSnapshot } from "@/app/actions/billing"
import { TierLimitNotice } from "@/components/billing/tier-notice"
import { getJourneySteps, hasExecutePlan } from "@/lib/journey/status"
import { PIPELINE_STOPS } from "@/lib/journey/navigation"
import { useProject } from "./project-context"
import { DeleteProject } from "./delete-project"
import type { StepState } from "@/lib/journey/status"

function pipelineStepState(
  journey: ReturnType<typeof getJourneySteps>,
  stageId: (typeof PIPELINE_STOPS)[number],
): StepState {
  return journey[stageId]
}

function pipelineStepLabel(
  journey: ReturnType<typeof getJourneySteps>,
  stageId: (typeof PIPELINE_STOPS)[number],
): string {
  switch (stageId) {
    case "discover":
      return journey.discoverLabel
    case "define":
      return journey.defineLabel
    case "design":
      return journey.designLabel
    case "execute":
      return journey.executeLabel
  }
}

function PipelineStepRow({
  index,
  stageId,
  state,
  label,
}: {
  index: number
  stageId: (typeof PIPELINE_STOPS)[number]
  state: StepState
  label: string
}) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          state === "done" && "bg-mint text-mint-foreground",
          state === "current" && "bg-primary text-primary-foreground",
          state === "upcoming" && "bg-secondary text-muted-foreground",
        )}
      >
        {state === "done" ? <Check className="h-3 w-3" /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            state === "current" && "font-medium text-foreground",
            state === "done" && "text-foreground",
            state === "upcoming" && "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {state === "current" && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
            <Clock className="h-3 w-3" /> In progress
          </p>
        )}
        {state === "done" && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-success">
            <Check className="h-3 w-3" /> Complete
          </p>
        )}
      </div>
    </li>
  )
}

function ProjectTitleInput({
  value,
  onChange,
  onSave,
}: {
  value: string
  onChange: (value: string) => void
  onSave: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      aria-label="Project name"
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className="w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-2xl font-semibold leading-tight tracking-tight text-foreground outline-none ring-0 focus-visible:ring-0 sm:text-3xl"
    />
  )
}

export function OverviewDashboard() {
  const router = useRouter()
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const [generating, setGenerating] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [tierUsage, setTierUsage] = useState<TierUsageSnapshot | null>(null)

  const journey = getJourneySteps(bundle)
  const planReady = hasExecutePlan(bundle)
  const atBlueprintLimit = tierUsage != null && !tierUsage.canCreateBlueprint

  useEffect(() => {
    let cancelled = false
    getTierUsage(projectId)
      .then((usage) => {
        if (!cancelled) setTierUsage(usage)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [projectId])

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
    if (atBlueprintLimit) return
    setGenerating(true)
    setPlanError(null)
    try {
      const result = await generateAndSaveCards(projectId)
      setBundle((b) => ({
        ...b,
        cards: result.cards,
        features: result.features,
        project: {
          ...b.project,
          stage: "tasks",
          foundation_prompt: result.foundation_prompt,
          database_schema: result.database_schema,
        },
      }))
      router.push(`/projects/${projectId}/execute`)
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Blueprint creation failed.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-4 lg:gap-6">
      <header className="w-full min-w-0">
        <ProjectTitleInput
          value={bundle.project.title}
          onChange={patchTitle}
          onSave={saveTitle}
        />
        {titleError && (
          <p className="mt-1 text-xs text-alert-text">{titleError}</p>
        )}
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {bundle.project.idea}
        </p>
      </header>

      <section className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          The pipeline
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          AIYA helps you avoid building the wrong software — not how to code,
          but what to ship first and what to build next.
        </p>
        <ol className="mt-4 space-y-3">
          {PIPELINE_STOPS.map((key, index) => (
            <PipelineStepRow
              key={key}
              index={index}
              stageId={key}
              state={pipelineStepState(journey, key)}
              label={pipelineStepLabel(journey, key)}
            />
          ))}
        </ol>

        {planReady && (
          <Link
            href={`/projects/${projectId}/execute`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto sm:min-w-[14rem]"
          >
            Open blueprint <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {!planReady && journey.design === "done" && (
          <>
            {atBlueprintLimit && tierUsage?.blueprintLimitMessage ? (
              <TierLimitNotice
                message={tierUsage.blueprintLimitMessage}
                className="mt-5"
              />
            ) : (
              <button
                type="button"
                onClick={generateExecutePlan}
                disabled={generating}
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[14rem]"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create blueprint <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
            {planError && (
              <p className="mt-2 text-xs text-alert-text">{planError}</p>
            )}
          </>
        )}
        {journey.design === "current" && journey.define === "done" && (
          <Link
            href={`/projects/${projectId}/design`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto sm:min-w-[14rem]"
          >
            Hand off to UX Designer <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {journey.discover === "current" && (
          <Link
            href={`/projects/${projectId}/discover`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto sm:min-w-[14rem]"
          >
            Start discovering <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {journey.define === "current" && journey.discover === "done" && (
          <Link
            href={`/projects/${projectId}/define`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto sm:min-w-[14rem]"
          >
            Hand off to Product Manager <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      <DeleteProject projectId={projectId} projectTitle={bundle.project.title} />
    </div>
  )
}
