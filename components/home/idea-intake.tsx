"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createProject } from "@/app/actions/projects"

const EXAMPLES = [
  "A tool that helps freelancers turn messy client notes into clean project briefs",
  "A VR app for practicing public speaking in front of a simulated audience",
  "A marketplace connecting home cooks with neighbors who want fresh meals",
]

export function IdeaIntake() {
  const router = useRouter()
  const [idea, setIdea] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <label htmlFor="idea" className="text-sm font-medium">
        What do you want to build?
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe your idea in a sentence or two. The analyst will ask questions
        from there.
      </p>
      <Textarea
        id="idea"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit()
        }}
        rows={4}
        placeholder="e.g. An AI that turns a raw product idea into a prioritized build plan…"
        className="mt-3"
      />
      {error && <p className="mt-2 text-sm text-warning">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Press ⌘/Ctrl + Enter
        </span>
        <Button onClick={submit} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Starting…
            </>
          ) : (
            <>
              Start discovery <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setIdea(ex)}
            className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
