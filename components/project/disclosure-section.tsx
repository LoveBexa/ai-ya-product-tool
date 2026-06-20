"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function DisclosureSection({
  title,
  subtitle,
  accentClass,
  defaultOpen = false,
  children,
  className,
}: {
  title: string
  subtitle?: string
  accentClass: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-18px_rgba(80,60,140,0.35)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
        aria-expanded={open}
      >
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            accentClass,
          )}
        >
          {title.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-tight">
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
