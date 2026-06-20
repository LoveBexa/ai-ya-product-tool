# AIYA — Architecture

**Last updated:** June 19, 2026

---

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Vercel AI SDK (`ai` v6) + **Google Gemini only** (`@ai-sdk/google`) |
| Persistence | Supabase (Postgres + JSONB) — required for saved projects |
| Validation | Zod (structured AI outputs) |

Package name: `ai-business-analyst`. Product name: **AIYA**.

---

## Routes

```
/                         Landing page
/start                    New project intake
/projects/[id]            Overview dashboard
/projects/[id]/discover   Discovery chat
/projects/[id]/define     MVP feature board
/projects/[id]/design     Flows, screens, schema blueprint
/projects/[id]/execute    Blueprint / build plan (export)
```

Legacy path aliases (`/decide`, `/build`) are still matched in navigation regexes. Primary routes use `/define` and `/execute`.

User-facing label **Blueprint** maps to internal stage id `execute`.

---

## Data model

Defined in `scripts/schema.sql`:

```
projects (1)
  ├── requirements (1:1)
  ├── features (1:many)     priority: must | nice | ignore
  ├── cards (1:many)        execution specs per must-have feature
  └── product_design (jsonb) UX flows + screens from Design stage
```

### Key `projects` columns

| Column | Purpose |
| --- | --- |
| `stage` | `discovery` → `requirements` → `mvp` → `tasks` |
| `chat` | Persisted discovery transcript (JSONB) |
| `foundation_prompt` | Scaffolding prompt for app shell |
| `product_design` | Hydrated design artifact (JSONB) — **requires migration if missing** |
| `database_schema` | Column exists; schema is primarily derived in UI via `schema-blueprint.ts` |

---

## Application structure

```
app/
  page.tsx, start/page.tsx       Marketing + intake
  projects/[id]/*                Journey pages (thin route wrappers)
  api/chat/route.ts              Streaming discovery chat
  actions/projects.ts            Server actions (CRUD + AI pipeline)

components/
  landing/                       Marketing (sticky dark nav, mobile layout)
  project/                       Journey UI
  home/                          Project list + idea intake

lib/
  ai/                            Prompts, model resolution, generation
  design/                        Design hydration + schema blueprint derivation
  journey/                       Navigation, stage status, specialist metadata
  build-plan/                    Markdown export assembler
  supabase/                      Admin client + config check
```

### UI shell (recent changes)

- **Landing:** sticky nav, solid black header, mobile-friendly layout
- **Project workspace:** sidebar shows AIYA brand; floating header inside projects removed
- **Discover chat:** viewport-locked full-height layout — messages scroll, chrome stays fixed
- **Overview:** editable project title via `ProjectProvider` + `updateProjectTitle` server action
- **Blueprint:** export button duplicated at bottom of build plan (in addition to top)

---

## State management

| Concern | Approach |
| --- | --- |
| Server persistence | Supabase via `getSupabaseAdmin()` in server actions |
| Client state | `ProjectProvider` + `ProjectBundle` (project, requirements, features, cards, design) |
| Discovery chat | `@ai-sdk/react` `useChat` → `DefaultChatTransport` → `/api/chat` |
| Cache invalidation | `revalidatePath` in server actions; optimistic `setBundle` patches on client |

### Chat persistence fix

Previously, `saveChat` did not update client context — navigating away lost history. Fixed by syncing `setBundle` on save and not re-seeding messages when a saved chat already exists.

---

## AI pipeline

All structured generation lives in `lib/ai/generate.ts`. Prompts in `lib/ai/prompts.ts`. Model resolution in `lib/ai/model.ts`.

### Provider

**Google Gemini only.** Ollama, OpenRouter, Vercel AI Gateway, and OpenAI were removed to simplify deployment.

```env
GOOGLE_GENERATIVE_AI_API_KEY=   # https://aistudio.google.com/apikey
GOOGLE_MODEL=gemini-2.0-flash   # default; separate free-tier quota from 2.5-flash
```

In-app model picker stores selection in `localStorage` key `aiya-discover-model`.

### Generation functions

| Function | API calls | Trigger |
| --- | --- | --- |
| Discovery chat (stream) | 1 per message | User sends message in Discover |
| `generateDiscoveryBundle` | **1** | **Generate requirements** (requirements + features combined) |
| `generateDesign` | 1 | **Create design flows** on Define → Design |
| `generateBlueprintBatch` | **1** | **Create blueprint** on Overview (all cards + foundation combined) |
| `generateFoundationPrompt` | 1 | Manual regenerate in Blueprint UI |

Legacy single-purpose functions (`generateRequirements`, `generateFeatures`, `generateQueueItem`) remain but main flows use batched calls.

### API call budget (typical happy path)

| Step | Gemini calls |
| --- | --- |
| Discovery chat | ~5–15 (user-driven) |
| Generate requirements | 1 |
| Create design flows | 1 |
| Create blueprint | 1 |
| **Total (excl. chat)** | **3** |

Previously: finish discovery = 2 calls; blueprint with 5 must-haves = 6+ calls.

### Error handling

- `maxRetries: 1` on all AI calls (fail fast on quota)
- `formatAiError()` in `lib/ai/errors.ts` — friendly messages for quota/rate-limit (429), suggests `gemini-2.0-flash` or pacing

### Structured output flow

```
Discover chat (stream, DISCOVERY_SYSTEM)
    ↓ Generate requirements
generateDiscoveryBundle (DISCOVERY_OUTPUT_SYSTEM)
    → requirements row + features rows
    ↓ Create design flows
generateDesign (DESIGN_SYSTEM) → hydrateProductDesign → product_design jsonb
    ↓ Create blueprint
generateBlueprintBatch (QUEUE_BATCH_SYSTEM)
    → cards rows + foundation_prompt on project
```

Schema blueprint is **derived** in `lib/design/schema-blueprint.ts` from design + must-have features — not a separate AI call.

---

## Server actions (`app/actions/projects.ts`)

Key actions added or changed in recent work:

| Action | Purpose |
| --- | --- |
| `finishDiscovery` | Single AI call → save requirements + features → navigate to Define |
| `generateAndSaveDesign` | AI design → `product_design` jsonb |
| `generateAndSaveCards` | Batch blueprint → cards + foundation_prompt |
| `updateProjectTitle` | Editable overview title |
| `saveChat` | Persist transcript + sync bundle |
| `saveProductDesign` | Persist screen purpose edits |

`ProjectBundle` type includes `design: ProductDesign | null`.

---

## Environment & local dev

```bash
npm install
cp .env.example .env.local
npm run dev   # http://localhost:3000
```

Supabase vars are optional for landing/demo but **required** for `/projects/[id]/*`. Without them, layout shows "Database not connected".

Demo: run `scripts/seed-demo-project.sql`, open `/projects/00000000-0000-4000-a800-000000000001`.

---

## Repo hygiene

`.gitignore` includes:

```
node_modules/
.next/
dist/
build/
.vercel/
.env
.env.local
```

Previously `.next` was accidentally tracked (~3000 files), causing push failures. Confirm remote history is clean.

---

## Known technical debt

| Issue | Location |
| --- | --- |
| TS error: `ChatMessage[]` role typing | `discovery-chat.tsx` ~line 126 |
| README outdated (multi-provider) | `README.md` |
| Design placeholder if user skips **Create design flows** | `design-view.tsx` |
| Materials upload is mock-only | `discovery-upload-zone.tsx` |

---

## Related docs

- [Vision](./vision.md)
- [Decisions](./decisions.md)
- [Roadmap](./roadmap.md)
- [Project state](./project-state.md)
