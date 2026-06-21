import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { resolveChatModel } from "@/lib/ai/model"
import { formatAiError } from "@/lib/ai/errors"
import { DISCOVERY_SYSTEM } from "@/lib/ai/prompts"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const {
      messages,
      idea,
    }: { messages: UIMessage[]; idea?: string } = await req.json()

    const system = idea
      ? `${DISCOVERY_SYSTEM}\n\nThe founder's initial one-line idea was: "${idea}". Begin discovery from there.`
      : DISCOVERY_SYSTEM

    const result = streamText({
      maxRetries: 0,
      model: resolveChatModel(),
      system,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => formatAiError(error),
    })
  } catch (e) {
    const message = formatAiError(e)
    const status = /free-tier limit|quota|rate.?limit/i.test(message) ? 429 : 500
    return Response.json({ error: message }, { status })
  }
}
