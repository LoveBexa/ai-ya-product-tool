"use client"

import { useRef } from "react"
import { FileUp, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DiscoveryMaterial, MaterialCategory } from "@/lib/mock/discovery-materials"

function guessCategory(file: File): MaterialCategory {
  const name = file.name.toLowerCase()
  if (
    name.includes("whatsapp") ||
    name.includes("slack") ||
    name.includes("discord") ||
    name.includes("telegram") ||
    name.endsWith(".md") ||
    name.endsWith(".txt")
  ) {
    return "chat"
  }
  if (name.includes("sketch") || name.includes("whiteboard") || name.includes("napkin")) {
    return "sketches"
  }
  return "drawings"
}

function mockMaterialFromFile(file: File): DiscoveryMaterial {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    category: guessCategory(file),
    kind: file.type.startsWith("image/") ? "Image upload" : "Document",
    meta: `${(file.size / 1024).toFixed(0)} KB`,
  }
}

export function DiscoveryUploadZone({
  onAdd,
  disabled,
  compact = false,
}: {
  onAdd: (material: DiscoveryMaterial) => void
  disabled?: boolean
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    Array.from(fileList).forEach((file) => onAdd(mockMaterialFromFile(file)))
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn(!compact && "mb-2")}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.md,.txt,.png,.jpg,.jpeg,.webp,.fig"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Upload files"
          title="Upload notes, screenshots, chats"
        >
          <Paperclip className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-mint/40 hover:bg-mint/5 hover:text-foreground disabled:opacity-50",
          )}
        >
          <FileUp className="h-4 w-4 shrink-0" />
          <span>
            Upload notes, screenshots, chats, wireframes — or drag files here
          </span>
        </button>
      )}
    </div>
  )
}
