"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { finishDiscovery } from "@/app/actions/projects"
import { formatAiError } from "@/lib/ai/errors"
import { getRequirementsGenerateBlocker } from "@/lib/journey/prerequisites"
import type { JourneyStop } from "@/lib/journey/navigation"
import type { ChatMessage } from "@/lib/types"
import { useProject } from "./project-context"
import { StageGeneratePanel } from "./stage-generate-panel"

export function DefinePlaceholder() {
  const { bundle, setBundle } = useProject()
  const router = useRouter()
  const projectId = bundle.project.id
  const idea = bundle.project.idea
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goBackTo, setGoBackTo] = useState<JourneyStop | null>(null)

  async function handleGenerate() {
    const blocker = getRequirementsGenerateBlocker(bundle)
    if (blocker) {
      setError(blocker.message)
      setGoBackTo(blocker.stop)
      return
    }

    setError(null)
    setGoBackTo(null)
    setGenerating(true)
    try {
      const chat = (bundle.project.chat ?? []) as ChatMessage[]
      const { requirements, features } = await finishDiscovery(
        projectId,
        idea,
        chat,
      )
      setBundle((b) => ({
        ...b,
        requirements,
        features,
        project: { ...b.project, stage: "mvp" },
      }))
    } catch (e) {
      setError(formatAiError(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <StageGeneratePanel
      stage="define"
      title="Your MVP cut isn't ready yet"
      description="Generate requirements from your discovery chat to populate must-have, later, and ignore features."
      actionLabel="Generate requirements"
      generatingLabel="Building Define board…"
      generating={generating}
      error={error}
      goBackTo={goBackTo}
      projectId={projectId}
      onAction={handleGenerate}
    />
  )
}
