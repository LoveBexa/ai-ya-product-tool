/** Turn raw AI provider errors into actionable messages for the UI. */
import {
  isQuotaError,
  isVercelServerless,
  parseRetryAfterSeconds,
} from "@/lib/ai/quota-retry"
import { resolveProvider } from "@/lib/ai/model"

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

  if (/insufficient balance|402/i.test(message)) {
    return (
      "DeepSeek API balance is empty. DeepSeek has no permanent free tier — new accounts get a one-time credit grant, then pay-as-you-go. " +
      "Top up at https://platform.deepseek.com/top_up or switch AI_PROVIDER=google in .env.local to use Gemini."
    )
  }

  if (isQuotaError(message)) {
    const hinted = parseRetryAfterSeconds(message)
    const waitHint = hinted
      ? isVercelServerless()
        ? ` Wait a minute, then try again (provider estimated ${hinted}s — auto-retry is limited on hosted deploys).`
        : ` Wait at least ${hinted + 10} seconds before retrying (provider estimated ${hinted}s — add a little buffer). If it still fails, wait a full minute.`
      : " Wait 60 seconds before trying again — rate limits often reset each minute."

    if (resolveProvider() === "deepseek") {
      return (
        `DeepSeek rate limit or quota hit.${waitHint} ` +
        `Check usage at https://platform.deepseek.com or switch AI_PROVIDER=google in your env.`
      )
    }

    return (
      `Gemini free-tier limit hit for this model.${waitHint} ` +
      `Switch GOOGLE_MODEL, pace discovery chat, set AI_PROVIDER=deepseek, or see https://ai.google.dev/pricing`
    )
  }

  return message || "AI request failed."
}
