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
  Route,
  Target,
  Clock,
  Hammer,
  FlaskConical,
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
  onStatus?: (status: CardStatus) => void
}) {
  const isBlueprint = card.card_type === "blueprint"
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
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:max-w-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">{featureName}</p>
            <h2 className="mt-0.5 text-base font-semibold leading-snug sm:text-lg">
              {card.title}
            </h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {onStatus && (
            <div className="flex flex-wrap gap-1.5">
              {STATUS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onStatus(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    card.status === key
                      ? "border-transparent bg-mint text-mint-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          )}

          {card.goal && (
            <section>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Goal
              </h3>
              <p className="text-sm leading-relaxed">{card.goal}</p>
            </section>
          )}

          {isBlueprint && card.user_journey && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Route className="h-3.5 w-3.5" /> Essential user journey
              </h3>
              <p className="rounded-xl bg-mint/15 p-3 text-sm leading-relaxed text-mint-foreground">
                {card.user_journey}
              </p>
            </section>
          )}

          {isBlueprint && card.success_criteria.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Success criteria — test before shipping
              </h3>
              <ul className="space-y-2">
                {card.success_criteria.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {card.how_to_build && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Hammer className="h-3.5 w-3.5" /> What to implement
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.how_to_build}
              </p>
            </section>
          )}

          {card.how_to_test && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5" /> How to test
              </h3>
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm leading-relaxed">
                {card.how_to_test}
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isBlueprint ? "Build phases" : "Done checklist"}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {card.subtasks.map((st, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setChecked((c) =>
                        c.map((v, idx) => (idx === i ? !v : v)),
                      )
                    }
                    className="flex w-full items-start gap-2.5 rounded-xl p-1.5 text-left text-sm transition-colors hover:bg-secondary"
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

          {isBlueprint && card.deferred_stages.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Not building yet
              </h3>
              <ul className="space-y-1.5">
                {card.deferred_stages.map((stage) => (
                  <li
                    key={stage}
                    className="rounded-xl bg-lilac/20 px-3 py-2 text-xs text-lilac-foreground"
                  >
                    {stage}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Copy into your coding tool
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
            <pre className="whitespace-pre-wrap rounded-xl border border-border bg-secondary p-3.5 font-mono text-xs leading-relaxed text-foreground">
              {card.ai_prompt}
            </pre>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Find help online
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={`https://www.google.com/search?q=${search}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm transition-colors hover:bg-leaf hover:text-leaf-foreground"
              >
                <span className="text-muted-foreground">
                Search: <span className="text-foreground">{card.resource_query}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${search}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm transition-colors hover:bg-pink hover:text-pink-foreground"
              >
                <span className="text-muted-foreground">Watch a tutorial</span>
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
