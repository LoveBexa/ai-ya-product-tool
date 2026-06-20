"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectBundle } from "@/app/actions/projects"
import type { ChatMessage, Feature, Requirements } from "@/lib/types"
import {
  saveChat,
  generateAndSaveRequirements,
  generateAndSaveFeatures,
} from "@/app/actions/projects"
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

export function DiscoveryChat({
  bundle,
  onDiscoveryComplete,
}: {
  bundle: ProjectBundle
  onDiscoveryComplete: (payload: {
    requirements: Requirements
    features: Feature[]
  }) => void
}) {
  const projectId = bundle.project.id
  const idea = bundle.project.idea
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

  const { messages, sendMessage, status } = useChat({
    id: projectId,
    messages: toInitial(bundle.project.chat ?? []),
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
    if (!seeded.current && messages.length === 0) {
      seeded.current = true
      sendMessage({ text: idea })
    }
  }, [messages.length, idea, sendMessage])

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return
    const chat: ChatMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: textOf(m),
    }))
    saveChat(projectId, chat).catch(() => {})
  }, [status, messages, projectId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy])

  function send() {
    const value = input.trim()
    if (!value || busy || !modelId) return
    sendMessage({ text: value })
    setInput("")
  }

  async function generate() {
    setError(null)
    setGenerating(true)
    try {
      const chat: ChatMessage[] = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: textOf(m),
      }))
      const requirements = await generateAndSaveRequirements(
        projectId,
        idea,
        chat,
      )
      const features = await generateAndSaveFeatures(projectId)
      onDiscoveryComplete({ requirements, features })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.")
    } finally {
      setGenerating(false)
    }
  }

  const exchanges = messages.filter((m) => m.role === "user").length
  const canGenerate = exchanges >= 2 && !busy

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col">
      <StageHeader stage="discover" />
      <div className="grid w-full flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_min(18rem,22rem)] lg:gap-6">
        <div className="flex min-h-[min(60vh,calc(100dvh-18rem))] flex-col rounded-2xl border border-border bg-card lg:min-h-[calc(100dvh-14rem)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-6">
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
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[min(100%,36rem)] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground sm:max-w-[85%]"
                      : "max-w-[min(100%,36rem)] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground sm:max-w-[85%]"
                  }
                >
                  {textOf(m) || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
                    </span>
                  )}
                </div>
              </div>
            ))}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
            {showAnalysisPreview && (
              <div className="flex justify-start">
                <DiscoveryAnalysisMessage />
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 sm:p-4">
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
                disabled={busy || !input.trim() || !modelId || modelsLoading}
                aria-label="Send"
                className="shrink-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4">
          <DiscoveryMaterialsPanel
            materials={materials}
            onMaterialsChange={setMaterials}
          />
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h3 className="text-base font-semibold tracking-tight">
              Ready to <span className="serif-accent">move on?</span>
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Once the analyst understands your idea, finish discovery to define
              what ships first.
            </p>
            <Button
              onClick={generate}
              disabled={!canGenerate || generating}
              className="mt-3 w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Finish discovery
                </>
              )}
            </Button>
            {!canGenerate && !busy && (
              <p className="mt-2 text-xs text-muted-foreground">
                Answer a couple of questions first.
              </p>
            )}
            {error && <p className="mt-2 text-xs text-warning">{error}</p>}
          </div>

          <DiscoveryLearnings requirements={bundle.requirements} />
        </aside>
      </div>
    </div>
  )
}
