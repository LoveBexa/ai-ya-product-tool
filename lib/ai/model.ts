import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

export type AiProvider = "google"

export interface ChatModelOption {
  id: string
  label: string
}

const CHAT_MODELS: ChatModelOption[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
]

export function resolveProvider(): AiProvider {
  return "google"
}

export function getDefaultChatModelId(): string {
  return process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"
}

export function listChatModels(): ChatModelOption[] {
  const defaultId = getDefaultChatModelId()
  if (CHAT_MODELS.some((m) => m.id === defaultId)) {
    return CHAT_MODELS
  }
  return [{ id: defaultId, label: defaultId }, ...CHAT_MODELS]
}

function googleClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is required. Get a key at https://aistudio.google.com/apikey",
    )
  }
  return createGoogleGenerativeAI({ apiKey })
}

/** Resolve a chat model id (used by Discover chat and structured generation). */
export function resolveChatModel(modelId?: string): LanguageModel {
  const allowed = listChatModels().map((m) => m.id)
  const defaultId = getDefaultChatModelId()
  const id = modelId && allowed.includes(modelId) ? modelId : defaultId
  return googleClient()(id)
}

export const AI_PROVIDER = resolveProvider()
export const BA_MODEL = resolveChatModel()
