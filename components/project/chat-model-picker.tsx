"use client"

/** Discover chat model is chosen server-side via AI_PROVIDER / DEEPSEEK_MODEL env vars. */
export function useDiscoverChatModel() {
  return { loading: false }
}
