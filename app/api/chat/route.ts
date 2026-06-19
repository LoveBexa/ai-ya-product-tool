import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { BA_MODEL } from "@/lib/ai/model"
import { DISCOVERY_SYSTEM } from "@/lib/ai/prompts"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, idea }: { messages: UIMessage[]; idea?: string } = await req.json()

  const system = idea
    ? `${DISCOVERY_SYSTEM}\n\nThe founder's initial one-line idea was: "${idea}". Begin discovery from there.`
    : DISCOVERY_SYSTEM

  const result = streamText({
    model: BA_MODEL,
    system,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
