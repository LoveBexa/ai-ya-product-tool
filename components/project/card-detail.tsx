"use client"

import { useEffect, useState } from "react"
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Youtube,
  CircleDot,
  Circle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TaskCard, CardStatus } from "@/lib/types"

const STATUS: { key: CardStatus; label: string; icon: typeof Circle }[] = [
  { key: "todo", label: "To do", icon: Circle },
  { key: "in_progress", label: "In progress", icon: CircleDot },
  { key: "done", label: "Done", icon: CheckCircle2 },
]

export function CardDetail({
  card,
  featureName,
  onClose,
  onStatus,
}: {
  card: TaskCard
  featureName: string
  onClose: () => void
  onStatus: (status: CardStatus) => void
}) {
  const [checked, setChecked] = useState<boolean[]>(
    () => card.subtasks.map(() => false),
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(card.ai_prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const search = encodeURIComponent(card.resource_query)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">{featureName}</p>
            <h2 className="mt-0.5 text-base font-semibold leading-snug">
              {card.title}
            </h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Status */}
          <div className="flex gap-1.5">
            {STATUS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onStatus(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                  card.status === key
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <section>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Goal
            </h3>
            <p className="text-sm leading-relaxed">{card.goal}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subtasks
            </h3>
            <ul className="flex flex-col gap-1.5">
              {card.subtasks.map((st, i) => (
                <li key={i}>
                  <button
                    onClick={() =>
                      setChecked((c) =>
                        c.map((v, idx) => (idx === i ? !v : v)),
                      )
                    }
                    className="flex w-full items-start gap-2.5 rounded-md p-1.5 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked[i]
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {checked[i] && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={cn(
                        "leading-relaxed",
                        checked[i] && "text-muted-foreground line-through",
                      )}
                    >
                      {st}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                AI build prompt
              </h3>
              <Button size="sm" variant="outline" onClick={copyPrompt}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-3 font-mono text-xs leading-relaxed text-foreground">
              {card.ai_prompt}
            </pre>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Learn how
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={`https://www.google.com/search?q=${search}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
              >
                <span className="text-muted-foreground">
                  Search docs: <span className="text-foreground">{card.resource_query}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${search}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
              >
                <span className="text-muted-foreground">Watch a tutorial</span>
                <Youtube className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
