"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const TESTIMONIALS = [
  {
    quote:
      "This helped me think through my idea before I wasted weeks building the wrong thing.",
    role: "Indie founder",
  },
  {
    quote:
      "AI can generate the code in minutes. AIYA helped me figure out what to build first.",
    role: "Solo builder",
  },
  {
    quote:
      "I thought I needed a coding tool. What I actually needed was clarity.",
    role: "Small business owner",
  },
  {
    quote:
      "Instead of asking ChatGPT 50 different questions, I ended up with one organised blueprint.",
    role: "Product designer",
  },
] as const

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0)
  const total = TESTIMONIALS.length
  const current = TESTIMONIALS[index]

  function goPrev() {
    setIndex((i) => (i - 1 + total) % total)
  }

  function goNext() {
    setIndex((i) => (i + 1) % total)
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="relative flex items-center gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border-border bg-card shadow-sm"
          onClick={goPrev}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <figure
          key={index}
          className="min-w-0 flex-1 rounded-3xl border border-mint/30 bg-card p-8 text-center shadow-[0_20px_50px_-24px_rgba(80,60,140,0.35)] sm:p-10"
        >
          <blockquote className="text-balance text-xl font-medium leading-snug tracking-tight sm:text-2xl">
            &ldquo;{current.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm text-muted-foreground">
            — {current.role}
          </figcaption>
        </figure>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border-border bg-card shadow-sm"
          onClick={goNext}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {index + 1} of {total}
      </p>
    </div>
  )
}
