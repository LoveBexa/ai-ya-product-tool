"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TierLimitNotice } from "@/components/billing/tier-notice"
import { createProject } from "@/app/actions/projects"
import type { TierUsageSnapshot } from "@/app/actions/billing"

const EXAMPLES = [
  "A tool that helps freelancers turn messy client notes into clean project briefs",
  "A VR app for practicing public speaking in front of a simulated audience",
  "A marketplace connecting home cooks with neighbors who want fresh meals",
]

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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-18px_rgba(80,60,140,0.4)] sm:p-7">
      <label htmlFor="idea" className="text-lg font-semibold tracking-tight">
        What&apos;s your <span className="serif-accent">idea?</span>
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about your idea — chat with AIYA, or bring notes and screenshots
        you&apos;ve already created.
      </p>
      {atProjectLimit && tierUsage?.projectLimitMessage && (
        <TierLimitNotice
          message={tierUsage.projectLimitMessage}
          className="mt-4"
        />
      )}
      <Textarea
        id="idea"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit()
        }}
        rows={4}
        placeholder="e.g. A marketplace where dog owners find trusted local walkers…"
        className="mt-3"
      />
      {error && <p className="mt-2 text-sm text-warning">{error}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={submit} disabled={pending || atProjectLimit} className="flex-1">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Starting…
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" /> Start chatting
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || atProjectLimit}
          className="flex-1"
          onClick={submit}
        >
          <Upload className="h-4 w-4" /> Upload notes &amp; screenshots
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Upload supports chats, sketches, wireframes — add files in Discover after
        you start.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setIdea(ex)}
            className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-lilac hover:text-lilac-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
