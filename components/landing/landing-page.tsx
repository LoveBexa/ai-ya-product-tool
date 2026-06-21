import Link from "next/link"
import {
  ArrowRight,
  Brain,
  Code2,
  FileText,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react"
import { DefineAppMockup, OutputCardsMockup } from "./mockups"
import { LandingNav } from "./landing-nav"
import { TestimonialsCarousel } from "./testimonials-carousel"

const PROCESS = [
  {
    step: 1,
    title: "Talk",
    body: "Describe your idea. We ask the right questions.",
    icon: MessageCircle,
    accent: "mint",
  },
  {
    step: 2,
    title: "Features",
    body: "Clarify your product, scope, and priorities.",
    icon: FileText,
    accent: "mint",
  },
  {
    step: 3,
    title: "Journey",
    body: "Map the experience, flows, screens, and data.",
    icon: LayoutGrid,
    accent: "lilac",
  },
  {
    step: 4,
    title: "Blueprint",
    body: "Export one document — spec, schema, and feature steps for your AI builder.",
    icon: Code2,
    accent: "lilac",
  },
] as const

const CONTRAST = [
  {
    them: "Build faster",
    us: "Think better",
    icon: Zap,
  },
  {
    them: "Generate software",
    us: "Generate understanding",
    icon: Code2,
  },
  {
    them: "Short-term chat context",
    us: "Long-term product memory",
    icon: Brain,
  },
] as const

function accentRing(accent: "mint" | "lilac") {
  return accent === "mint"
    ? "bg-mint/15 text-mint ring-mint/30"
    : "bg-lilac/15 text-lilac ring-lilac/30"
}

export function LandingPage() {
  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <LandingNav dark />

      <div className="relative overflow-hidden bg-[#0a0a0f] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(120,80,255,0.35),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-32 h-96 bg-[radial-gradient(circle_at_50%_50%,rgba(163,230,53,0.08),transparent_55%)]"
        />

        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mint">
              Your AI product team
            </p>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Clarity before code.
              <br />
              Build with{" "}
              <span className="bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-mint bg-clip-text text-transparent">
                confidence.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
              AIYA turns messy ideas into a clear, editable blueprint — so you always
              know what you&apos;re building, what comes next, and what to ship first.
            </p>

            <div className="mt-8 flex flex-col items-center gap-2">
              <Link
                href="/start"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-7 text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90 sm:text-base"
              >
                Start your project <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-white/40">No credit card required</p>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
            <DefineAppMockup />
          </div>
        </section>
      </div>

      <section id="how-it-works" className="scroll-mt-28 bg-[#fafaf9] py-16 sm:scroll-mt-20 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            From idea to blueprint
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            Four stages. One exportable plan - before you ask AI to build anything.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(({ step, title, body, icon: Icon, accent }, i) => (
              <div key={title} className="relative text-center">
                {i < PROCESS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] border-t border-dashed border-border lg:block"
                  />
                )}
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ring-1 ${accentRing(accent)}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {step}
                </p>
                <h3 className="mt-1 text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="why-aiya"
        className="scroll-mt-28 border-y border-mint/50 bg-gradient-to-br from-[#e8ffc4] via-mint/70 to-[#d4f7a8] py-16 sm:scroll-mt-20 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-mint-foreground/15 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint-foreground shadow-sm">
              <Sparkles className="h-3 w-3" />
              Why AIYA
            </p>
            <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-mint-foreground sm:text-3xl">
              Think before you build
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-mint-foreground/85 sm:text-base">
              Every AI builder asks you to describe your app and build as you think.
              AIYA helps you think before you build, guiding you from a rough idea to a
              blueprint for an app worth building. Think clearer. Build better.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CONTRAST.map(({ them, us, icon: Icon }) => (
              <div
                key={us}
                className="rounded-2xl border border-mint-foreground/10 bg-white/75 p-5 shadow-[0_10px_40px_-20px_rgba(40,90,40,0.45)] backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-mint-foreground ring-2 ring-white/80">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-xs text-mint-foreground/45 line-through decoration-mint-foreground/35">
                  {them}
                </p>
                <p className="mt-1 text-sm font-semibold text-mint-foreground">{us}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm font-medium leading-relaxed text-mint-foreground sm:text-base">
          AI can generate code in minutes. AIYA helps you figure out what to build first, so you launch a well-thought-out minimal viable product that's ready to test, not constantly rebuild.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-[#f4f4f7] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Clarity people actually feel
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Not another coding tool — a way to know what to build before you build it.
          </p>

          <TestimonialsCarousel />
        </div>
      </section>

      <section className="bg-lilac/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your idea deserves a{" "}
                <span className="serif-accent">blueprint.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Step back, get clarity, and leave with a plan you can trust — spec,
                schema, flows, and feature prompts in one export.
              </p>
              <Link
                href="/start"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-mint-foreground transition-opacity hover:opacity-90"
              >
                Start your first project <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <OutputCardsMockup />
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>AIYA — your AI product team</p>
      </footer>
    </div>
  )
}
