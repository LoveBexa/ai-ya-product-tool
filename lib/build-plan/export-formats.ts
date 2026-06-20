import { assembleBuildPlanMarkdown, type BuildPlanInput } from "./export"
import { assemblePlainlangSpec } from "./plainlang-export"

export type ExportFormatId = "blueprint" | "plainlang"

export interface ExportFormat {
  id: ExportFormatId
  label: string
  description: string
  extension: string
  mimeType: string
  assemble: (input: BuildPlanInput) => string
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "blueprint",
    label: "Blueprint",
    description: "PRD + build plan for Cursor, Claude, and similar tools",
    extension: ".md",
    mimeType: "text/markdown;charset=utf-8",
    assemble: assembleBuildPlanMarkdown,
  },
  {
    id: "plainlang",
    label: "Plainlang spec",
    description: "Formal ***plain specification for codeplain",
    extension: ".plain",
    mimeType: "text/plain;charset=utf-8",
    assemble: assemblePlainlangSpec,
  },
]

export function getExportFormat(id: ExportFormatId): ExportFormat {
  return EXPORT_FORMATS.find((f) => f.id === id) ?? EXPORT_FORMATS[0]
}

export function exportFilename(projectTitle: string, format: ExportFormat): string {
  const slug = projectTitle.replace(/\s+/g, "-").toLowerCase()
  const suffix = format.id === "plainlang" ? "spec" : "blueprint"
  return `${slug}-${suffix}${format.extension}`
}
