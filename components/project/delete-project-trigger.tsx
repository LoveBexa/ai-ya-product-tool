"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { deleteProject } from "@/app/actions/projects"
import { DELETE_CONFIRMATION_PHRASE } from "@/lib/projects/constants"
import { clearDiscoverySkipped } from "@/lib/journey/onboarding-skip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function DeleteProjectTrigger({
  projectId,
  projectTitle,
  variant = "compact",
  className,
  onDeleted,
}: {
  projectId: string
  projectTitle: string
  variant?: "compact" | "inline"
  className?: string
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const matches = phrase === DELETE_CONFIRMATION_PHRASE

  function close() {
    setOpen(false)
    setPhrase("")
    setError(null)
  }

  function confirmDelete() {
    if (!matches) {
      setError(`Type "${DELETE_CONFIRMATION_PHRASE}" exactly to confirm.`)
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await deleteProject(projectId, phrase)
        clearDiscoverySkipped(projectId)
        close()
        onDeleted?.()
        router.push("/start")
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete project.")
      }
    })
  }

  if (variant === "inline") {
    return (
      <div className={cn("space-y-3", className)}>
        {!open ? (
          <Button
            type="button"
            variant="outline"
            className="border-pink/40 text-pink-foreground hover:bg-pink/15"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete project
          </Button>
        ) : (
          <ConfirmPanel
            phrase={phrase}
            setPhrase={setPhrase}
            error={error}
            pending={pending}
            matches={matches}
            onCancel={close}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`Delete ${projectTitle}`}
        aria-expanded={open}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-pink/15 hover:text-pink-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close delete dialog"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={close}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm font-medium text-foreground">Delete project?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Remove <span className="font-medium text-foreground">{projectTitle}</span>{" "}
              permanently. Type{" "}
              <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px]">
                {DELETE_CONFIRMATION_PHRASE}
              </code>{" "}
              to confirm.
            </p>
            <ConfirmPanel
              compact
              phrase={phrase}
              setPhrase={setPhrase}
              error={error}
              pending={pending}
              matches={matches}
              onCancel={close}
              onConfirm={confirmDelete}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ConfirmPanel({
  phrase,
  setPhrase,
  error,
  pending,
  matches,
  onCancel,
  onConfirm,
  compact = false,
}: {
  phrase: string
  setPhrase: (v: string) => void
  error: string | null
  pending: boolean
  matches: boolean
  onCancel: () => void
  onConfirm: () => void
  compact?: boolean
}) {
  return (
    <div className={cn("space-y-3", compact ? "mt-3" : "mt-4")}>
      <Input
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder={DELETE_CONFIRMATION_PHRASE}
        className="rounded-xl font-mono text-xs"
        autoComplete="off"
      />
      {error && <p className="text-xs text-pink-foreground">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!matches || pending}
          className="bg-pink text-pink-foreground hover:opacity-90 disabled:opacity-40"
          onClick={onConfirm}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4" /> Delete
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
