# AIYA — Project State

**Snapshot for handover** · Last updated: June 19, 2026

This document is the **current-state summary**. Deeper detail lives in sibling docs:

| Doc | Contents |
| --- | --- |
| [vision.md](./vision.md) | Product vision, problem, philosophy, north star |
| [architecture.md](./architecture.md) | Stack, routes, data model, AI pipeline |
| [roadmap.md](./roadmap.md) | Shipped features, backlog, priorities |
| [decisions.md](./decisions.md) | ADR-style record of choices made |

---

## One-line summary

AIYA is a Next.js + Supabase + Gemini app that guides founders from idea → requirements → MVP scope → UX design → exportable blueprint, with batched AI calls and a polished four-stage journey UI.

---

## What works today

End-to-end flow on a Supabase-backed project:

1. **Start** — enter idea at `/start`
2. **Discover** — chat with BA persona; click **Generate requirements**
3. **Define** — review/edit must-nice-ignore features; click **Create design flows**
4. **Design** — review flows, screens, schema; edit screen purposes
5. **Overview** — click **Create blueprint**
6. **Blueprint** — ordered cards, foundation prompt, markdown export

All project data persists: chat, requirements, features, design, cards, foundation prompt.

---

## Recent session changes (Cursor context)

Work completed in recent development sessions:

| Area | Change |
| --- | --- |
| **AI provider** | Google Gemini only; removed Ollama/OpenRouter/Gateway/OpenAI |
| **Quota** | Default `gemini-2.0-flash`; `formatAiError`; `maxRetries: 1` |
| **API batching** | `generateDiscoveryBundle` (2→1); `generateBlueprintBatch` (N+1→1) |
| **Discovery chat** | Fixed replies, memory sync, full-height layout, error display |
| **Generate requirements** | Inline + sidebar buttons; auto-navigate to Define |
| **Design** | Wired **Create design flows** → `generateAndSaveDesign` → `product_design` |
| **Overview** | Editable title; **Create blueprint** CTA |
| **Blueprint** | Foundation auto-saved with batch; export button at bottom too |
| **Shell** | Sticky landing nav; sidebar AIYA branding; no floating project header |
| **Git** | `.gitignore` for `.next/`, env files |

---

## Environment checklist

```env
# Required for AI
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash

# Required for saved projects
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Migration if design save fails:**

```sql
alter table projects add column if not exists product_design jsonb;
```

**LocalStorage:** clear `aiya-discover-model` if model picker stuck on an exhausted model.

---

## Open issues

| Priority | Issue |
| --- | --- |
| High | TS error in `discovery-chat.tsx` (ChatMessage role typing) |
| High | README still describes multi-provider stack |
| High | Confirm git remote has no `.next` in history |
| Medium | Discovery materials are UI mock only |
| Medium | Evolve stage not implemented |
| Medium | Design shows placeholder if user skips **Create design flows** |
| Low | No CI, no automated tests |

---

## API call budget

| Step | Calls |
| --- | --- |
| Discovery chat | ~5–15 |
| Generate requirements | 1 |
| Create design flows | 1 |
| Create blueprint | 1 |
| **Structured total** | **3** |

---

## Key files

```
app/actions/projects.ts       Server actions + ProjectBundle
lib/ai/generate.ts            Batched + legacy generation
lib/ai/prompts.ts             System prompts
lib/ai/model.ts               Gemini resolution
app/api/chat/route.ts         Streaming discovery
components/project/discovery-chat.tsx
components/project/phase-nav.tsx
components/project/build-plan.tsx
components/project/overview-dashboard.tsx
scripts/schema.sql
```

---

## Next actions (recommended order)

1. Run `product_design` migration on Supabase
2. Fix TypeScript error in discovery chat
3. Update README to match docs
4. Smoke test full journey with `gemini-2.0-flash`
5. Wire discovery materials → AI (first MVP+ feature)

See [roadmap.md](./roadmap.md) for full backlog.

---

## Philosophy

> Build less. Think better. Ship with confidence.
