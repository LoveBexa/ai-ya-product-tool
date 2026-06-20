"use client"

import { useEffect, useState } from "react"
import { generateAndSaveCards } from "@/app/actions/projects"
import { getTierUsage, type TierUsageSnapshot } from "@/app/actions/billing"
import { formatAiError } from "@/lib/ai/errors"
import { getBlueprintGenerateBlocker } from "@/lib/journey/prerequisites"
import type { JourneyStop } from "@/lib/journey/navigation"
import { TierLimitNotice } from "@/components/billing/tier-notice"
import { useProject } from "./project-context"
import { StageGeneratePanel } from "./stage-generate-panel"
import { StageHeader } from "./stage-header"

export function BlueprintPlaceholder() {
  const { bundle, setBundle } = useProject()
  const projectId = bundle.project.id
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goBackTo, setGoBackTo] = useState<JourneyStop | null>(null)
  const [tierUsage, setTierUsage] = useState<TierUsageSnapshot | null>(null)

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

  const atBlueprintLimit = tierUsage != null && !tierUsage.canCreateBlueprint

  async function handleGenerate() {
    if (atBlueprintLimit) return

    const blocker = getBlueprintGenerateBlocker(bundle)
    if (blocker) {
      setError(blocker.message)
      setGoBackTo(blocker.stop)
      return
    }

    setError(null)
    setGoBackTo(null)
    setGenerating(true)
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
    } catch (e) {
      setError(formatAiError(e))
    } finally {
      setGenerating(false)
    }
  }

  if (atBlueprintLimit && tierUsage?.blueprintLimitMessage) {
    return (
      <div className="w-full space-y-4">
        <StageHeader stage="execute" />
        <TierLimitNotice message={tierUsage.blueprintLimitMessage} />
      </div>
    )
  }

  return (
    <StageGeneratePanel
      stage="execute"
      title="Your blueprint isn't ready yet"
      description="Pulls together Discover, Define, and Design into one export — spec, flows, schema, foundation prompt, and ordered feature steps."
      actionLabel="Create blueprint"
      generatingLabel="Creating blueprint…"
      generating={generating}
      error={error}
      goBackTo={goBackTo}
      projectId={projectId}
      onAction={handleGenerate}
    />
  )
}
