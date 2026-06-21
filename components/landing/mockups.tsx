import {
  Briefcase,
  Code2,
  FileText,
  Flag,
  GitBranch,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SIDEBAR = [
  { label: "Chat", icon: MessageCircle, active: false },
  { label: "Features", icon: FileText, active: true },
  { label: "Plan", icon: LayoutGrid, active: false },
  { label: "Blueprint", icon: Code2, active: false },
  { label: "Versions", icon: GitBranch, active: false },
]

const DEFINE_CARDS = [
  { title: "Audience", hint: "Who you're building for", icon: Users },
  { title: "Problem", hint: "The problem you're solving", icon: Target },
  { title: "Solution", hint: "Your proposed solution", icon: Sparkles },
  { title: "MVP Scope", hint: "Must-have, nice-to-have, future ideas", icon: Flag },
  { title: "Success Metric", hint: "How we measure success", icon: TrendingUp },
]

export function DefineAppMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      <div className="flex border-b border-white/10 bg-[#0f0f14] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="flex min-h-[280px] sm:min-h-[320px]">
        <aside className="hidden w-36 shrink-0 border-r border-white/10 bg-[#0d0d12] p-3 sm:block">
          <ul className="space-y-1">
            {SIDEBAR.map(({ label, icon: Icon, active }) => (
              <li key={label}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs",
                    active
                      ? "bg-mint/15 text-mint"
                      : "text-white/45",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Features</h3>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-white/60">
              Edit
            </span>
          </div>

          <ul className="space-y-2">
            {DEFINE_CARDS.map(({ title, hint, icon: Icon }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-mint">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="text-[11px] text-white/45">{hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function OutputCardsMockup({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto h-[260px] w-full max-w-md sm:h-[280px]", className)}>
      <div className="absolute left-0 top-6 w-[58%] rotate-[-4deg] rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          User flows
        </p>
        <div className="mt-2 space-y-1.5">
          {["Visit", "Sign up", "Book"].map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-full rounded-md border border-border bg-secondary/60 px-2 py-1 text-center text-[10px] font-medium">
                {step}
              </div>
              {i < 2 && <span className="text-[10px] text-muted-foreground/50">↓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-0 w-[54%] rotate-[3deg] rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Screen inventory
        </p>
        <ul className="mt-2 space-y-1">
          {["Landing page", "Dashboard", "Project page", "Settings", "Billing"].map(
            (screen) => (
              <li
                key={screen}
                className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-[10px]"
              >
                {screen}
              </li>
            ),
          )}
        </ul>
      </div>

      <div className="absolute bottom-0 left-[18%] w-[62%] rotate-[1deg] rounded-xl border border-mint/30 bg-card p-3 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-mint-foreground">
          Blueprint
        </p>
        <ol className="mt-2 space-y-1 text-[10px]">
          <li className="rounded-md bg-mint/10 px-2 py-1 font-medium">1. Foundation</li>
          <li className="rounded-md bg-secondary/50 px-2 py-1">2. Authentication</li>
          <li className="rounded-md bg-secondary/50 px-2 py-1">3. Core features</li>
        </ol>
      </div>
    </div>
  )
}
