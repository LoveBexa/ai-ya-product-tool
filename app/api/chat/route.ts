import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { resolveChatModel } from "@/lib/ai/model"
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
      model: resolveChatModel(model),
      system,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
