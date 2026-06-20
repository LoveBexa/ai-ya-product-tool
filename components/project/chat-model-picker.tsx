"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "aiya-discover-model"

export function useDiscoverChatModel() {
  const [modelId, setModelId] = useState("")
  const [provider, setProvider] = useState("")
  const [models, setModels] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/chat/models")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const list = data.models as { id: string; label: string }[]
        setModels(list)
        setProvider(data.provider as string)
        const saved = localStorage.getItem(STORAGE_KEY)
        const valid =
          saved && list.some((m: { id: string }) => m.id === saved)
            ? saved
            : data.defaultModel
        setModelId(valid)
        localStorage.setItem(STORAGE_KEY, valid)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function setModel(id: string) {
    setModelId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return { modelId, setModel, models, provider, loading }
}

export function ChatModelPicker({
  modelId,
  models,
  provider,
  loading,
  disabled,
  onChange,
}: {
  modelId: string
  models: { id: string; label: string }[]
  provider: string
  loading: boolean
  disabled?: boolean
  onChange: (id: string) => void
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading models…
      </span>
    )
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <label htmlFor="chat-model" className="sr-only">
        Chat model
      </label>
      <select
        id="chat-model"
        value={modelId}
        disabled={disabled || !modelId}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "max-w-full truncate rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium",
          "focus:outline-none focus:ring-2 focus:ring-mint/40",
          disabled && "opacity-50",
        )}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {provider && (
        <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
          via {provider}
        </span>
      )}
    </div>
  )
}
