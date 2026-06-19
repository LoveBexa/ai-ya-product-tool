"use client"

import { useState } from "react"
import { Loader2, Save, Sparkles, Users, Target, Lightbulb, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  updateRequirements,
  generateAndSaveFeatures,
} from "@/app/actions/projects"
import type { Requirements, Feature, RequirementsDraft } from "@/lib/types"

const FIELDS: {
  key: keyof RequirementsDraft
  label: string
  icon: typeof Users
}[] = [
  { key: "audience", label: "Target audience", icon: Users },
  { key: "problem", label: "Problem", icon: Target },
  { key: "solution", label: "Solution", icon: Lightbulb },
  { key: "revenue_model", label: "Revenue model / goal", icon: DollarSign },
  { key: "success_metric", label: "Success metric", icon: TrendingUp },
]

export function RequirementsView({
  projectId,
  requirements,
  onChange,
  onFeatures,
}: {
  projectId: string
  requirements: Requirements
  onChange: (r: Requirements) => void
  onFeatures: (f: Feature[]) => void
}) {
  const [draft, setDraft] = useState<RequirementsDraft>({
    audience: requirements.audience,
    problem: requirements.problem,
    solution: requirements.solution,
    revenue_model: requirements.revenue_model,
    success_metric: requirements.success_metric,
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    draft.audience !== requirements.audience ||
    draft.problem !== requirements.problem ||
    draft.solution !== requirements.solution ||
    draft.revenue_model !== requirements.revenue_model ||
    draft.success_metric !== requirements.success_metric

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateRequirements(projectId, draft)
      onChange(updated)
      setSavedAt(new Date().toLocaleTimeString())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      if (dirty) await save()
      const features = await generateAndSaveFeatures(projectId)
      onFeatures(features)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Requirements brief</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The analyst&apos;s read on your idea. Edit anything that&apos;s off
            before cutting the MVP.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {FIELDS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </label>
              <Textarea
                value={draft[key]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.value }))
                }
                rows={2}
                className="leading-relaxed"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={save}
            disabled={!dirty || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save edits
          </Button>
          {savedAt && !dirty && (
            <span className="text-xs text-muted-foreground">
              Saved at {savedAt}
            </span>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Cut the MVP</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Turn this brief into a prioritized feature list — Must Have, Nice to
            Have, and Ignore — each with the reasoning.
          </p>
          <Button
            onClick={generate}
            disabled={generating}
            className="mt-3 w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Cutting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate MVP cut
              </>
            )}
          </Button>
          {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        </div>
      </aside>
    </div>
  )
}
