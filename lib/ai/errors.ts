/** Turn raw AI provider errors into actionable messages for the UI. */
export function formatAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/quota|rate.?limit|429|resource.?exhausted|exceeded your current quota/i.test(message)) {
    const waitMatch = message.match(/retry in ([\d.]+)s/i)
    const waitHint = waitMatch
      ? ` Try again in about ${Math.ceil(Number(waitMatch[1]))} seconds.`
      : " Wait a minute and try again."

    return (
      `Gemini free-tier limit hit for this model.${waitHint} ` +
      `You can switch GOOGLE_MODEL to gemini-2.0-flash in .env.local (separate quota), ` +
      `pace chat messages, or enable billing at https://ai.google.dev/pricing`
    )
  }

  if (/Failed after \d+ attempts/.test(message)) {
    return formatAiError(message.replace(/^Failed after \d+ attempts\. Last error: /, ""))
  }

  return message || "AI request failed."
}
