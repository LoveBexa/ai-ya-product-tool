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
      model,
    }: { messages: UIMessage[]; idea?: string; model?: string } =
      await req.json()

    const system = idea
      ? `${DISCOVERY_SYSTEM}\n\nThe founder's initial one-line idea was: "${idea}". Begin discovery from there.`
      : DISCOVERY_SYSTEM

    const result = streamText({
      maxRetries: 1,
      model: resolveChatModel(model),
      system,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    const message = formatAiError(e)
    const status = /free-tier limit|quota|rate.?limit/i.test(message) ? 429 : 500
    return Response.json({ error: message }, { status })
  }
}
