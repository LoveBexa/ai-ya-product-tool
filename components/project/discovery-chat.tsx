"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/lib/types"
import {
  saveChat,
  finishDiscovery,
} from "@/app/actions/projects"
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
import {
  ChatModelPicker,
  useDiscoverChatModel,
} from "./chat-model-picker"
import { StageIncompleteBanner } from "./stage-generate-panel"
import { getRequirementsGenerateBlocker, isDiscoveryComplete } from "@/lib/journey/prerequisites"

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
  const { modelId, setModel, models, provider, loading: modelsLoading } =
    useDiscoverChatModel()
  const modelIdRef = useRef(modelId)
  modelIdRef.current = modelId

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            idea,
            model: modelIdRef.current || undefined,
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
  const seeded = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { materials, setMaterials } = useDiscoveryMaterials([])

  const busy = status === "streaming" || status === "submitted"
  const showAnalysisPreview = materials.length >= 2

  useEffect(() => {
    if (seeded.current || modelsLoading || !modelId) return
    if (messages.length > 0 || savedChat.length > 0) {
      seeded.current = true
      return
    }
    seeded.current = true
    sendMessage({ text: idea })
  }, [messages.length, savedChat.length, idea, sendMessage, modelId, modelsLoading])

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return

    const chat: ChatMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
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
      project: { ...bundle.project, chat: messages.map((m) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: textOf(m),
      })).filter((m) => m.content.trim()) },
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
    <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <StageHeader stage="discover" />
        {!discoveryComplete && (
          <StageIncompleteBanner message="Keep chatting with the analyst until you're ready — then generate requirements to unlock Define." />
        )}
      </div>
      <div className="grid w-full min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_min(18rem,22rem)] lg:gap-6">
        <div className="flex min-h-[min(60vh,calc(100dvh-18rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-full lg:min-h-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-6">
            <p className="text-xs text-muted-foreground">
              Discovery chat · model applies to new messages
            </p>
            <ChatModelPicker
              modelId={modelId}
              models={models}
              provider={provider}
              loading={modelsLoading}
              disabled={busy}
              onChange={setModel}
            />
          </div>
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
                    <div className="max-w-[min(100%,36rem)] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground sm:max-w-[85%]">
                      {text}
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className="flex justify-start">
                  <div className="flex max-w-[min(100%,36rem)] flex-col items-start gap-2 sm:max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      {text || (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
                        </span>
                      )}
                    </div>
                    {showCta && (
                      <div className="flex w-full flex-col gap-2 pl-1">
                        <Button
                          onClick={generate}
                          disabled={generating}
                          className="h-10 w-full rounded-full sm:w-auto sm:min-w-[14rem]"
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
                        {error && (
                          <p className="text-xs text-alert-text">{error}</p>
                        )}
                      </div>
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
                {chatError.message || "Chat request failed. Check your API key and restart the dev server."}
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

        <aside className="flex min-h-0 w-full flex-col gap-4 overflow-y-auto lg:max-h-full">
          <div className="shrink-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <Button
              onClick={generate}
              disabled={generating || busy}
              className="h-12 w-full rounded-full text-sm font-semibold"
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
            {error && <p className="mt-2 text-xs text-alert-text">{error}</p>}
          </div>

          <DiscoveryMaterialsPanel
            materials={materials}
            onMaterialsChange={setMaterials}
          />
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h3 className="text-base font-semibold tracking-tight">
              Ready to <span className="serif-accent">move on?</span>
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Turns your chat into a requirements brief and MVP feature cards on
              the Define board.
            </p>
          </div>

          <DiscoveryLearnings requirements={bundle.requirements} />
        </aside>
      </div>
    </div>
  )
}
