/** Turn raw AI provider errors into actionable messages for the UI. */
import {
  isQuotaError,
  isVercelServerless,
  parseRetryAfterSeconds,
} from "@/lib/ai/quota-retry"

function unwrapAiError(error: unknown): unknown {
  if (!error || typeof error !== "object") return error

  const record = error as {
    lastError?: unknown
    cause?: unknown
    errors?: unknown[]
    message?: string
  }

  if (record.lastError) return unwrapAiError(record.lastError)
  if (record.cause) return unwrapAiError(record.cause)
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    return unwrapAiError(record.errors[record.errors.length - 1])
  }

  return error
}

export function formatAiError(error: unknown): string {
  const root = unwrapAiError(error)
  const message =
    root instanceof Error ? root.message : String(root ?? error ?? "")

  if (/Failed after \d+ attempts/.test(message)) {
    return formatAiError(message.replace(/^Failed after \d+ attempts\. Last error: /, ""))
  }

  if (isQuotaError(message)) {
    const hinted = parseRetryAfterSeconds(message)
    const waitHint = hinted
      ? isVercelServerless()
        ? ` Wait a minute, then try again (Google estimated ${hinted}s — auto-retry is limited on hosted deploys).`
        : ` Wait at least ${hinted + 10} seconds before retrying (Google estimated ${hinted}s — add a little buffer). If it still fails, wait a full minute; free tier limits are per-minute.`
      : " Wait 60 seconds before trying again — free tier limits reset each minute."

    return (
      `Gemini free-tier limit hit for this model.${waitHint} ` +
      `Use gemini-2.0-flash in .env.local for a separate quota, pace discovery chat, or see https://ai.google.dev/pricing`
    )
  }

  return message || "AI request failed."
}
