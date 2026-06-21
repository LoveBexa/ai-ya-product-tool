import type { Project, ProjectStage } from "@/lib/types"

export const PROJECT_EMOJI_PICKS = [
  "🏠", "🏪", "🍳", "🐕", "🎤", "💪", "💼", "📱", "🎯", "✨",
  "🚀", "💡", "🛒", "📊", "🎨", "🏥", "✈️", "🎮", "📚", "🔧",
] as const

export function projectEmoji(title: string, idea: string): string {
  const text = `${title} ${idea}`.toLowerCase()
  if (text.includes("marketplace") || text.includes("shop")) return "🏪"
  if (text.includes("cook") || text.includes("meal") || text.includes("food"))
    return "🍳"
  if (text.includes("dog") || text.includes("walk")) return "🐕"
  if (text.includes("vr") || text.includes("speaking")) return "🎤"
  if (text.includes("fitness") || text.includes("coach")) return "💪"
  if (text.includes("freelanc") || text.includes("crm")) return "💼"
  return "🏠"
}

export function resolveProjectEmoji(
  project: Pick<Project, "emoji" | "title" | "idea">,
): string {
  const stored = project.emoji?.trim()
  if (stored) return stored
  return projectEmoji(project.title, project.idea)
}

export function relativeLastEdited(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "Last edited just now"
  if (minutes < 60) return `Last edited ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last edited ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Last edited yesterday"
  return `Last edited ${days}d ago`
}

const STAGE_BASE: Record<ProjectStage, number> = {
  discovery: 15,
  requirements: 35,
  mvp: 55,
  tasks: 75,
}

export function blueprintProgress(project: Project): number {
  let percent = STAGE_BASE[project.stage] ?? 10
  if (project.stage === "tasks") {
    if (project.product_design) percent += 10
    if (project.foundation_prompt?.trim()) percent += 15
  }
  return Math.min(100, percent)
}

export function blueprintProgressLabel(percent: number): string {
  return percent >= 100 ? "Blueprint complete" : "Blueprint progress"
}
