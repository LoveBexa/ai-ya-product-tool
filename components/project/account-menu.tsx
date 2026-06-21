"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function AccountMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("Your name")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("aiya-user-name")
    if (saved?.trim()) setName(saved.trim())
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const initial = name.charAt(0).toUpperCase() || "?"

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-secondary"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
          {initial}
        </span>
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">Account</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[9rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
