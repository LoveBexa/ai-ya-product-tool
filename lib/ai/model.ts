import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createDeepSeek } from "@ai-sdk/deepseek"
import type { LanguageModel } from "ai"

export type AiProvider = "google" | "deepseek"

export interface ChatModelOption {
  id: string
  label: string
}

const DEEPSEEK_MODELS: ChatModelOption[] = [
  { id: "deepseek-chat", label: "DeepSeek Chat" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
]

const GOOGLE_MODELS: ChatModelOption[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
]

/** Active provider — set via AI_PROVIDER env (server-only, not user-selectable). */
export function resolveProvider(): AiProvider {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (configured === "google" || configured === "deepseek") {
    return configured
  }
  if (process.env.DEEPSEEK_API_KEY) return "deepseek"
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google"
  return "deepseek"
}

export function getDefaultChatModelId(): string {
  const provider = resolveProvider()
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"
  }
  return process.env.GOOGLE_MODEL?.trim() || "gemini-2.0-flash"
}

export function listChatModels(): ChatModelOption[] {
  const provider = resolveProvider()
  const models = provider === "deepseek" ? DEEPSEEK_MODELS : GOOGLE_MODELS
  const defaultId = getDefaultChatModelId()
  if (models.some((m) => m.id === defaultId)) return models
  return [{ id: defaultId, label: defaultId }, ...models]
}

function resolveModelId(modelId?: string): string {
  const allowed = listChatModels().map((m) => m.id)
  const defaultId = getDefaultChatModelId()
  if (modelId && allowed.includes(modelId)) return modelId
  return defaultId
}

function deepseekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is required. Get a key at https://platform.deepseek.com",
    )
  }
  return createDeepSeek({ apiKey })
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

/** Resolve the active chat model (Discover chat + structured generation). */
export function resolveChatModel(modelId?: string): LanguageModel {
  const id = resolveModelId(modelId)
  if (resolveProvider() === "deepseek") {
    return deepseekClient()(id)
  }
  return googleClient()(id)
}

let cachedBAModel: LanguageModel | null = null

/** Lazy model — avoids requiring API keys when only loading project pages. */
export function getBAModel(): LanguageModel {
  if (!cachedBAModel) {
    cachedBAModel = resolveChatModel()
  }
  return cachedBAModel
}

export const AI_PROVIDER = resolveProvider()
