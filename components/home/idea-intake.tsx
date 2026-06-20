"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createProject } from "@/app/actions/projects"
import type { TierUsageSnapshot } from "@/app/actions/billing"

const EXAMPLES = [
  {
    label: "Dog Walking Marketplace",
    idea:
      "A marketplace where dog owners find trusted local walkers, book walks, and leave reviews.",
  },
  {
    label: "Public Speaking VR",
    idea:
      "A VR app for practicing public speaking in front of a simulated audience with real-time feedback.",
  },
  {
    label: "Home Cook Marketplace",
    idea:
      "A marketplace connecting home cooks with neighbors who want fresh meals delivered locally.",
  },
] as const

export function IdeaIntake({
  tierUsage,
}: {
  tierUsage?: TierUsageSnapshot | null
}) {
  const router = useRouter()
  const [idea, setIdea] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const atProjectLimit = tierUsage != null && !tierUsage.canCreateProject

  function submit() {
    if (atProjectLimit) return
    const value = idea.trim()
    if (value.length < 8) {
      setError("Tell me a little more about your idea (at least a sentence).")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const id = await createProject(value)
        router.push(`/projects/${id}`)
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not start the project.",
        )
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        What&apos;s your <span className="serif-accent">idea?</span>
      </h1>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={atProjectLimit}
            onClick={() => setIdea(ex.idea)}
            className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-lilac/50 hover:bg-lilac/15 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <Textarea
        id="idea"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit()
        }}
        rows={3}
        placeholder="Describe your app, business or product idea."
        disabled={atProjectLimit}
        className="mt-6 min-h-[7rem] resize-none text-base sm:text-lg"
      />

      {error && (
        <p className="mt-2 text-center text-sm text-alert-text">{error}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          onClick={submit}
          disabled={pending || atProjectLimit}
          className="sm:min-w-[11rem]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create Blueprint"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || atProjectLimit}
          className="sm:min-w-[11rem]"
          onClick={submit}
        >
          <Upload className="h-4 w-4" /> Upload Material
        </Button>
      </div>
    </div>
  )
}
