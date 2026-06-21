const STORAGE_KEY = "aiya-skipped-discovery"

function readSkippedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : []
  } catch {
    return []
  }
}

function writeSkippedIds(ids: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function markDiscoverySkipped(projectId: string) {
  const ids = readSkippedIds()
  if (!ids.includes(projectId)) {
    writeSkippedIds([...ids, projectId])
  }
}

export function hasDiscoverySkipped(projectId: string): boolean {
  return readSkippedIds().includes(projectId)
}

export function clearDiscoverySkipped(projectId: string) {
  writeSkippedIds(readSkippedIds().filter((id) => id !== projectId))
}
