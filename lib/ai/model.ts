import { createOpenAI } from "@ai-sdk/openai"
import { createGateway } from "@ai-sdk/gateway"
import type { LanguageModel } from "ai"

export type AiProvider = "gateway" | "openai" | "ollama" | "openrouter" | "deepseek"

export interface ChatModelOption {
  id: string
  label: string
}

const PROVIDERS: AiProvider[] = [
  "gateway",
  "openai",
  "ollama",
  "openrouter",
  "deepseek",
]

const CHAT_MODELS: Record<AiProvider, ChatModelOption[]> = {
  ollama: [
    { id: "qwen2.5:14b", label: "Qwen 2.5 14B" },
    { id: "llama3.2", label: "Llama 3.2" },
    { id: "mistral", label: "Mistral" },
    { id: "gemma2", label: "Gemma 2" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  ],
  openrouter: [
    { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
    { id: "openai/gpt-4o", label: "GPT-4o" },
    { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  ],
  deepseek: [
    { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
    { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
  ],
  gateway: [
    { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
    { id: "openai/gpt-4o", label: "GPT-4o" },
  ],
}

export function resolveProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase()
  if (explicit && PROVIDERS.includes(explicit as AiProvider)) {
    return explicit as AiProvider
  }
  return process.env.NODE_ENV === "development" ? "ollama" : "gateway"
}

export function getDefaultChatModelId(
  provider: AiProvider = resolveProvider(),
): string {
  switch (provider) {
    case "ollama":
      return process.env.OLLAMA_MODEL ?? "qwen2.5:14b"
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    case "openrouter":
      return process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"
    case "deepseek":
      return process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat"
    case "gateway":
      return process.env.AI_GATEWAY_MODEL ?? "openai/gpt-5.4-mini"
  }
}

export function listChatModels(
  provider: AiProvider = resolveProvider(),
): ChatModelOption[] {
  const models = [...CHAT_MODELS[provider]]
  const defaultId = getDefaultChatModelId(provider)
  if (!models.some((m) => m.id === defaultId)) {
    models.unshift({ id: defaultId, label: defaultId })
  }
  return models
}

function openRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter or deepseek.",
    )
  }
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "AIYA",
    },
  })
}

/** Resolve a chat model id for the active provider (used by Discover chat). */
export function resolveChatModel(modelId?: string): LanguageModel {
  const provider = resolveProvider()
  const allowed = listChatModels(provider).map((m) => m.id)
  const defaultId = getDefaultChatModelId(provider)
  const id =
    modelId && allowed.includes(modelId) ? modelId : defaultId

  switch (provider) {
    case "ollama": {
      const baseURL =
        process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1"
      const ollama = createOpenAI({ baseURL, apiKey: "ollama" })
      return ollama(id)
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error(
          "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
        )
      }
      return createOpenAI({ apiKey })(id)
    }
    case "openrouter":
    case "deepseek":
      return openRouterClient()(id)
    case "gateway":
    default: {
      const apiKey = process.env.AI_GATEWAY_API_KEY
      const gateway = createGateway(apiKey ? { apiKey } : undefined)
      return gateway(id)
    }
  }
}

export const AI_PROVIDER = resolveProvider()
export const BA_MODEL = resolveChatModel()
