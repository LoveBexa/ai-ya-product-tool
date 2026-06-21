"use client"

import { useEffect, useState } from "react"

const DEFAULT_MODEL = "gemini-2.0-flash"

/** Discover chat always uses the default free-tier Gemini model. */
export function useDiscoverChatModel() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return {
    modelId: DEFAULT_MODEL,
    loading,
  }
}
