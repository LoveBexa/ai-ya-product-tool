"use client"

import { useState } from "react"
import { CheckCircle2, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardDetail } from "./card-detail"
import { updateCardStatus } from "@/app/actions/projects"
import type { Feature, TaskCard, CardStatus } from "@/lib/types"

const COLUMN_ACCENTS = [
  "bg-mint text-mint-foreground",
  "bg-lilac text-lilac-foreground",
  "bg-yellow text-yellow-foreground",
  "bg-leaf text-leaf-foreground",
  "bg-pink text-pink-foreground",
]

export function KanbanBoard({
  projectId,
  features,
  cards,
  onChange,
}: {
  projectId: string
  features: Feature[]
  cards: TaskCard[]
  onChange: (c: TaskCard[]) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const mustFeatures = features
    .filter((f) => f.priority === "must")
    .sort((a, b) => a.sort_order - b.sort_order)

  const active = cards.find((c) => c.id === activeId) ?? null
  const activeFeature = active
    ? features.find((f) => f.id === active.feature_id)
    : null

  function setStatus(card: TaskCard, status: CardStatus) {
    onChange(cards.map((c) => (c.id === card.id ? { ...c, status } : c)))
    updateCardStatus(card.id, projectId, status).catch(() => {})
  }

  const done = cards.filter((c) => c.status === "done").length

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Task <span className="serif-accent">board</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One column per Must Have feature. Open a card for subtasks, a
            ready-to-paste AI prompt, and resources.
          </p>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-sm font-medium text-mint-foreground">
          {done}/{cards.length} done
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {mustFeatures.map((feature, i) => {
          const featureCards = cards
            .filter((c) => c.feature_id === feature.id)
            .sort((a, b) => a.sort_order - b.sort_order)
          const accent = COLUMN_ACCENTS[i % COLUMN_ACCENTS.length]
          return (
            <div
              key={feature.id}
              className="flex w-72 shrink-0 flex-col gap-2.5"
            >
              <div className={cn("rounded-2xl px-4 py-3", accent)}>
                <h3 className="text-sm font-semibold leading-snug">
                  {feature.name}
                </h3>
                <span className="text-xs opacity-80">
                  {featureCards.length} cards
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {featureCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setActiveId(card.id)}
                    className={cn(
                      "rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(80,60,140,0.35)]",
                      card.status === "done" && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug",
                          card.status === "done" && "line-through",
                        )}
                      >
                        {card.title}
                      </p>
                      {card.status === "done" && (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      )}
                      {card.status === "in_progress" && (
                        <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {card.goal}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {card.subtasks.length} subtasks
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {active && activeFeature && (
        <CardDetail
          card={active}
          featureName={activeFeature.name}
          onClose={() => setActiveId(null)}
          onStatus={(status) => setStatus(active, status)}
        />
      )}
    </div>
  )
}
