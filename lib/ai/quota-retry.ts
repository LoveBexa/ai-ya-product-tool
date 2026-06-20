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

export function isVercelServerless(): boolean {
  return process.env.VERCEL === "1"
}

/** Seconds to wait before retry — capped on Vercel so functions don't time out. */
export function quotaRetryDelaySeconds(message: string): number {
  const hinted = parseRetryAfterSeconds(message)
  const raw = hinted != null ? hinted + 10 : 45

  if (isVercelServerless()) {
    // Hobby/Pro functions have strict limits — don't sleep 40s+ inside one invocation.
    return Math.min(raw, 8)
  }

  return Math.min(raw, 30)
}

export async function withQuotaRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts }: { maxAttempts?: number } = {},
): Promise<T> {
  const attempts = maxAttempts ?? (isVercelServerless() ? 2 : 3)
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isLast = attempt >= attempts - 1

      if (!isQuotaError(message) || isLast) {
        throw error
      }

      const waitSec = quotaRetryDelaySeconds(message)
      await sleep(waitSec * 1000)
    }
  }

  throw lastError
}
