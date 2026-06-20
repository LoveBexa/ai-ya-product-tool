"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { deleteProject } from "@/app/actions/projects"
import { DELETE_CONFIRMATION_PHRASE } from "@/lib/projects/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DeleteProject({
  projectId,
  projectTitle,
}: {
  projectId: string
  projectTitle: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const matches = phrase === DELETE_CONFIRMATION_PHRASE

  function confirmDelete() {
    if (!matches) {
      setError(`Type "${DELETE_CONFIRMATION_PHRASE}" exactly to confirm.`)
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await deleteProject(projectId, phrase)
        router.push("/start")
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete project.")
      }
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Danger zone
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Permanently delete <span className="font-medium text-foreground">{projectTitle}</span>{" "}
        and all discovery, features, and blueprints. This cannot be undone.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-pink/40 text-pink-foreground hover:bg-pink/15"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete project
        </Button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-pink/30 bg-pink/10 p-4">
          <p className="text-sm">
            Type{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              {DELETE_CONFIRMATION_PHRASE}
            </code>{" "}
            to confirm.
          </p>
          <Input
            value={phrase}
            onChange={(e) => {
              setPhrase(e.target.value)
              setError(null)
            }}
            placeholder={DELETE_CONFIRMATION_PHRASE}
            className="rounded-xl font-mono text-xs"
            autoComplete="off"
          />
          {error && <p className="text-sm text-pink-foreground">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setOpen(false)
                setPhrase("")
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!matches || pending}
              className="bg-pink text-pink-foreground hover:opacity-90 disabled:opacity-40"
              onClick={confirmDelete}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete forever
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
