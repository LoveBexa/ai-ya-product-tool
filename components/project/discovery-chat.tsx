"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectBundle } from "@/app/actions/projects"
import type { ChatMessage, Requirements } from "@/lib/types"
import {
  saveChat,
  generateAndSaveRequirements,
} from "@/app/actions/projects"

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
  onRequirements,
}: {
  bundle: ProjectBundle
  onRequirements: (r: Requirements) => void
}) {
  const projectId = bundle.project.id
  const idea = bundle.project.idea

  const { messages, sendMessage, status } = useChat({
    id: projectId,
    messages: toInitial(bundle.project.chat ?? []),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, idea },
      }),
    }),
  })

  const [input, setInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seeded = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const busy = status === "streaming" || status === "submitted"

  // Kick off the interview with the stored idea on first load.
  useEffect(() => {
    if (!seeded.current && messages.length === 0) {
      seeded.current = true
      sendMessage({ text: idea })
    }
  }, [messages.length, idea, sendMessage])

  // Persist transcript whenever streaming settles.
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
    if (!value || busy) return
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
      onRequirements(requirements)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.")
    } finally {
      setGenerating(false)
    }
  }

  const exchanges = messages.filter((m) => m.role === "user").length
  const canGenerate = exchanges >= 2 && !busy

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
        <div
          ref={scrollRef}
          className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground"
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
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
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
              className="min-h-9 max-h-40"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Ready to move on?</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Once the analyst understands your audience, problem, solution, and a
            success metric, generate the requirements brief.
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
                <Sparkles className="h-4 w-4" /> Generate requirements
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

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium text-muted-foreground">
            Your idea
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed">{idea}</p>
        </div>
      </aside>
    </div>
  )
}
