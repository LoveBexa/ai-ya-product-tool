import type { StageId } from "@/lib/journey/specialists"

export type JourneyStop = "overview" | "discover" | "define" | "design" | "execute"

export type PipelineStageId = Exclude<StageId, "evolve">

export const JOURNEY_STOPS: JourneyStop[] = [
  "overview",
  "discover",
  "define",
  "design",
  "execute",
]

const STOP_PATH: Record<JourneyStop, string> = {
  overview: "",
  discover: "/discover",
  define: "/define",
  design: "/design",
  execute: "/execute",
}

const STOP_MATCH: Record<JourneyStop, RegExp> = {
  overview: /\/projects\/[^/]+$/,
  discover: /\/discover/,
  define: /\/define|\/decide/,
  design: /\/design/,
  execute: /\/execute|\/build/,
}

export const STOP_LABEL: Record<JourneyStop, string> = {
  overview: "Overview",
  discover: "Discover",
  define: "Define",
  design: "Design",
  execute: "Blueprint",
}

export function projectPath(projectId: string, stop: JourneyStop): string {
  return `/projects/${projectId}${STOP_PATH[stop]}`
}

export function currentJourneyStop(pathname: string): JourneyStop {
  for (const stop of [...JOURNEY_STOPS].reverse()) {
    if (stop !== "overview" && STOP_MATCH[stop].test(pathname)) return stop
  }
  if (STOP_MATCH.overview.test(pathname)) return "overview"
  return "overview"
}

export function adjacentJourneyStops(stop: JourneyStop): {
  prev: JourneyStop | null
  next: JourneyStop | null
} {
  const index = JOURNEY_STOPS.indexOf(stop)
  return {
    prev: index > 0 ? JOURNEY_STOPS[index - 1] : null,
    next: index < JOURNEY_STOPS.length - 1 ? JOURNEY_STOPS[index + 1] : null,
  }
}

/** Pipeline steps shown in the timeline (excludes overview). */
export const PIPELINE_STOPS: PipelineStageId[] = [
  "discover",
  "define",
  "design",
  "execute",
]
