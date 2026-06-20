/** Five stages — stripped to the essence of AIYA. */

export type StageId = "discover" | "define" | "design" | "execute" | "evolve"

export interface StageMeta {
  id: StageId
  label: string
  role: string
  headline: string
  subtitle: string
  handoffFrom: StageId | null
  handoffTo: StageId | null
}

export const STAGES: Record<StageId, StageMeta> = {
  discover: {
    id: "discover",
    label: "Discover",
    role: "AI Business Analyst",
    headline: "Understand the idea",
    subtitle: "Problem, audience, goal, and assumptions.",
    handoffFrom: null,
    handoffTo: "define",
  },
  define: {
    id: "define",
    label: "Define",
    role: "AI Product Manager",
    headline: "Define the MVP",
    subtitle: "What must exist, what can wait, and what to ignore.",
    handoffFrom: "discover",
    handoffTo: "design",
  },
  design: {
    id: "design",
    label: "Design",
    role: "AI UX Designer",
    headline: "Design the flows",
    subtitle: "User flows and screen inventory — enough to build.",
    handoffFrom: "define",
    handoffTo: "execute",
  },
  execute: {
    id: "execute",
    label: "Blueprint",
    role: "AI Technical Lead",
    headline: "Your blueprint",
    subtitle:
      "One exportable document — spec, schema, foundation, and ordered feature steps.",
    handoffFrom: "design",
    handoffTo: null,
  },
  evolve: {
    id: "evolve",
    label: "Evolve",
    role: "AI Product Strategist",
    headline: "Evolve the product",
    subtitle: "Feedback, insights, and what to build next after launch.",
    handoffFrom: "execute",
    handoffTo: null,
  },
}

export function stageMeta(id: StageId): StageMeta {
  return STAGES[id]
}
