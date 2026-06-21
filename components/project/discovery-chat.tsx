"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Loader2, PanelRight, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/lib/types"
import { saveChat, finishDiscovery } from "@/app/actions/projects"
import { useProject } from "./project-context"
import { formatAiError } from "@/lib/ai/errors"
import { DiscoveryLearnings } from "./discovery-learnings"
import { StageHeader } from "./stage-header"
import {
  DiscoveryMaterialsPanel,
  useDiscoveryMaterials,
} from "./discovery-materials-panel"
import { DiscoveryUploadZone } from "./discovery-upload-zone"
import { DiscoveryAnalysisMessage } from "./discovery-analysis-message"
import { useDiscoverChatModel } from "./chat-model-picker"
import { StageIncompleteBanner } from "./stage-generate-panel"
import {
  getRequirementsGenerateBlocker,
  isDiscoveryComplete,
} from "@/lib/journey/prerequisites"

const DEFAULT_CHAT_MODEL = "gemini-2.0-flash"

function textOf(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function toInitial(chat: ChatMessage[]): UIMessage[] {
  return chat.map((m, i) => ({
    id: `seed-${i}`,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  }))
}

function isDiscoveryReadyMessage(text: string): boolean {
  const lower = text
    .toLowerCase()
    .replace(/[\u201c\u201d\u2018\u2019]/g, '"')
    .replace(/\s+/g, " ")

  if (lower.includes("generate requirements")) return true
  if (lower.includes("finish discovery")) return true
  if (
    lower.includes("move forward") &&
    (lower.includes("understanding") ||
      lower.includes("click") ||
      lower.includes("generate"))
  ) {
    return true
  }
  if (
    lower.includes("solid understanding") &&
    (lower.includes("move forward") || lower.includes("continue"))
  ) {
    return true
  }

  return false
}

export function DiscoveryChat() {
  const { bundle, setBundle } = useProject()
  const router = useRouter()
  const projectId = bundle.project.id
  const idea = bundle.project.idea
  const savedChat = bundle.project.chat ?? []
  const { modelId, loading: modelsLoading } = useDiscoverChatModel()
  const modelIdRef = useRef(DEFAULT_CHAT_MODEL)
  modelIdRef.current = modelId || DEFAULT_CHAT_MODEL

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            idea,
            model: modelIdRef.current,
          },
        }),
      }),
    [idea],
  )

  const { messages, sendMessage, status, error: chatError } = useChat({
    id: projectId,
    messages: toInitial(savedChat),
    transport,
  })

  const [input, setInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outputsOpen, setOutputsOpen] = useState(false)
  const seeded = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { materials, setMaterials } = useDiscoveryMaterials([])

  const busy = status === "streaming" || status === "submitted"
  const showAnalysisPreview = materials.length >= 2

  useEffect(() => {
    if (seeded.current || modelsLoading) return
    if (messages.length > 0 || savedChat.length > 0) {
      seeded.current = true
      return
    }
    seeded.current = true
    sendMessage({ text: idea })
  }, [messages.length, savedChat.length, idea, sendMessage, modelsLoading])

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return

    const chat: ChatMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as ChatMessage["role"],
        content: textOf(m).trim(),
      }))
      .filter((m) => m.content.length > 0)

    if (chat.length === 0) return

    const next = JSON.stringify(chat)
    const prev = JSON.stringify(savedChat)
    if (next === prev) return

    saveChat(projectId, chat)
      .then(() => {
        setBundle((b) => ({
          ...b,
          project: { ...b.project, chat },
        }))
      })
      .catch(() => {})
  }, [status, messages, projectId, savedChat, setBundle])

  function send() {
    const value = input.trim()
    if (!value || busy || modelsLoading) return
    sendMessage({ text: value })
    setInput("")
  }

  async function generate() {
    const blocker = getRequirementsGenerateBlocker({
      ...bundle,
      project: {
        ...bundle.project,
        chat: messages
          .map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: textOf(m),
          }))
          .filter((m) => m.content.trim()),
      },
    })
    if (blocker) {
      setError(blocker.message)
      return
    }

    setError(null)
    setGenerating(true)
    try {
      const chat: ChatMessage[] = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: textOf(m),
      }))
      const { requirements, features } = await finishDiscovery(
        projectId,
        idea,
        chat,
      )
      setBundle((b) => ({
        ...b,
        requirements,
        features,
        project: { ...b.project, stage: "mvp" },
      }))
      router.push(`/projects/${projectId}/define`)
    } catch (e) {
      setError(formatAiError(e))
    } finally {
      setGenerating(false)
    }
  }

  const lastMessage = messages[messages.length - 1]
  const lastAssistantText =
    lastMessage?.role === "assistant" ? textOf(lastMessage) : ""
  const showInlineGenerate =
    !busy &&
    !generating &&
    lastMessage?.role === "assistant" &&
    lastAssistantText.length > 0 &&
    isDiscoveryReadyMessage(lastAssistantText)

  const discoveryComplete = isDiscoveryComplete(bundle)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy, showInlineGenerate])

  return (
    <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_1fr] gap-3">
      <div className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <StageHeader stage="discover" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setOutputsOpen((open) => !open)}
            >
              {outputsOpen ? (
                <>
                  <X className="h-4 w-4" /> Hide outputs
                </>
              ) : (
                <>
                  <PanelRight className="h-4 w-4" /> Discovery outputs
                </>
              )}
            </Button>
            <Button
              onClick={generate}
              disabled={generating || busy}
              className="h-9 rounded-full sm:min-w-[11rem]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Building Define board…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate requirements
                </>
              )}
            </Button>
          </div>
        </div>
        {!discoveryComplete && (
          <StageIncompleteBanner message="Keep chatting with the analyst until you're ready — then generate requirements to unlock Define." />
        )}
        {error && <p className="text-xs text-alert-text">{error}</p>}
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_min(18rem,22rem)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6"
          >
            {messages.map((m, index) => {
              const text = textOf(m)
              const isLast = index === messages.length - 1
              const showCta =
                showInlineGenerate && isLast && m.role === "assistant"

              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      {text}
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className="flex justify-start">
                  <div className="flex max-w-[min(100%,42rem)] flex-col items-start gap-2">
                    <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      {text || (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
                        </span>
                      )}
                    </div>
                    {showCta && (
                      <Button
                        onClick={generate}
                        disabled={generating}
                        className="h-10 rounded-full sm:min-w-[14rem]"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Building Define board…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" /> Generate requirements
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
            {chatError && (
              <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-alert-text">
                {chatError.message ||
                  "Chat request failed. Check your API key and restart the dev server."}
              </p>
            )}
            {showAnalysisPreview && (
              <div className="flex justify-start">
                <DiscoveryAnalysisMessage />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-3 sm:p-4">
            <DiscoveryUploadZone
              onAdd={(m) => setMaterials((prev) => [...prev, m])}
              disabled={busy}
            />
            <div className="mt-2 flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="Answer the analyst…"
                className="min-h-9 max-h-40 flex-1"
              />
              <Button
                size="icon"
                onClick={send}
                disabled={busy || !input.trim() || modelsLoading}
                aria-label="Send"
                className="shrink-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {(outputsOpen || materials.length > 0) && (
          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:max-h-full">
            {outputsOpen && (
              <DiscoveryLearnings requirements={bundle.requirements} />
            )}
            {materials.length > 0 && (
              <DiscoveryMaterialsPanel
                materials={materials}
                onMaterialsChange={setMaterials}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
