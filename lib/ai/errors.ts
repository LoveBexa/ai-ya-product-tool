/** Turn raw AI provider errors into actionable messages for the UI. */
import {
  isQuotaError,
  parseRetryAfterSeconds,
} from "@/lib/ai/quota-retry"

export function formatAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (isQuotaError(message)) {
    const hinted = parseRetryAfterSeconds(message)
    const waitHint = hinted
      ? ` Wait at least ${hinted + 10} seconds before retrying (Google estimated ${hinted}s — add a little buffer). If it still fails, wait a full minute; free tier limits are per-minute.`
      : " Wait 60 seconds before trying again — free tier limits reset each minute."

    return (
      `Gemini free-tier limit hit for this model.${waitHint} ` +
      `Use gemini-2.0-flash in .env.local for a separate quota, pace discovery chat, or see https://ai.google.dev/pricing`
    )
  }

  if (/Failed after \d+ attempts/.test(message)) {
    return formatAiError(message.replace(/^Failed after \d+ attempts\. Last error: /, ""))
  }

  return message || "AI request failed."
}
