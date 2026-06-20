export function isQuotaError(message: string): boolean {
  return /quota|rate.?limit|429|resource.?exhausted|exceeded your current quota/i.test(
    message,
  )
}

/** Parse "retry in 38.5s" style hints from Gemini / AI SDK errors. */
export function parseRetryAfterSeconds(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)\s*s/i)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? Math.ceil(seconds) : null
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Seconds to wait before retry — API hint plus buffer (limits are often sliding windows). */
export function quotaRetryDelaySeconds(message: string): number {
  const hinted = parseRetryAfterSeconds(message)
  if (hinted != null) return hinted + 10
  return 45
}

export async function withQuotaRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3 }: { maxAttempts?: number } = {},
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isLast = attempt >= maxAttempts - 1

      if (!isQuotaError(message) || isLast) {
        throw error
      }

      const waitSec = quotaRetryDelaySeconds(message)
      await sleep(waitSec * 1000)
    }
  }

  throw lastError
}
