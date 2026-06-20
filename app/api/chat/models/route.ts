import {
  AI_PROVIDER,
  getDefaultChatModelId,
  listChatModels,
} from "@/lib/ai/model"

export async function GET() {
  const models = listChatModels()
  const defaultModel = getDefaultChatModelId()

  return Response.json({
    provider: AI_PROVIDER,
    models,
    defaultModel,
  })
}
