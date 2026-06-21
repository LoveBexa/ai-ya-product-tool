"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  PROJECT_EMOJI_PICKS,
  resolveProjectEmoji,
} from "@/lib/home/project-card-meta"

function AutoTextarea({
  value,
  onChange,
  onSave,
  ariaLabel,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSave: (value: string) => void
  ariaLabel: string
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={cn(
        "w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 outline-none ring-0 focus-visible:ring-0",
        className,
      )}
    />
  )
}

export function ProjectInfoSection({
  title,
  description,
  emoji,
  idea,
  error,
  onTitleChange,
  onDescriptionChange,
  onEmojiChange,
  onSaveTitle,
  onSaveDescription,
  onSaveEmoji,
}: {
  title: string
  description: string
  emoji: string
  idea: string
  error: string | null
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onEmojiChange: (value: string) => void
  onSaveTitle: (value: string) => void
  onSaveDescription: (value: string) => void
  onSaveEmoji: (value: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const displayEmoji = emoji.trim() || resolveProjectEmoji({ emoji, title, idea })

  useEffect(() => {
    if (!pickerOpen) return
    function onPointerDown(e: MouseEvent) {
      if (pickerRef.current?.contains(e.target as Node)) return
      setPickerOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [pickerOpen])

  function pickEmoji(next: string) {
    onEmojiChange(next)
    onSaveEmoji(next)
    setPickerOpen(false)
  }

  return (
    <section className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Project information
      </p>

      <div className="mt-4 flex items-start gap-3">
        <div ref={pickerRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Choose project emoji"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary/50 text-2xl transition-colors hover:bg-secondary"
          >
            {displayEmoji}
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 grid w-[9.5rem] grid-cols-5 gap-1 rounded-xl border border-border bg-card p-2 shadow-lg">
              {PROJECT_EMOJI_PICKS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Use ${e}`}
                  onClick={() => pickEmoji(e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-secondary",
                    displayEmoji === e && "bg-mint/30 ring-1 ring-mint/50",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <AutoTextarea
            value={title}
            onChange={onTitleChange}
            onSave={onSaveTitle}
            ariaLabel="Project title"
            className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl"
          />
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onBlur={(e) => onSaveDescription(e.target.value)}
              rows={3}
              aria-label="Project description"
              placeholder="What are you building?"
              className="min-h-[4.5rem] resize-y rounded-xl border-border bg-secondary/30 text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-alert-text">{error}</p>}
    </section>
  )
}
