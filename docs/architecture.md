# AIYA — Architecture

**Last updated:** June 20, 2026

---

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Vercel AI SDK (`ai` v6) + **Google Gemini only** (`@ai-sdk/google`) |
| Persistence | Supabase (Postgres + JSONB) |
| Validation | Zod (structured AI outputs) |
| Hosting | Vercel (configured in `vercel.json`) |

Package name: `ai-business-analyst`. Product name: **AIYA**.

---

## Routes

```
/                         Landing page
/start                    New project intake (+ project list)
/projects/[id]            Overview dashboard
/projects/[id]/discover   Discovery chat
/projects/[id]/define     MVP feature board
/projects/[id]/design     Flows, screens, schema blueprint
/projects/[id]/execute    Blueprint / build plan (export)
```

Legacy aliases `/decide`, `/build` still matched in navigation regexes.

User-facing label **Blueprint** → internal stage id `execute`.

---

## Data model

```
projects (1)
  ├── requirements (1:1)
  ├── features (1:many)       priority: must | nice | ignore
  ├── cards (1:many)          execution specs per must-have feature
  └── product_design (jsonb)  UX flows + screens from Design stage
```

### Key `projects` columns

| Column | Purpose |
| --- | --- |
| `stage` | `discovery` → `requirements` → `mvp` → `tasks` |
| `chat` | Discovery transcript (JSONB) |
| `foundation_prompt` | App shell scaffolding prompt |
| `product_design` | Design artifact (JSONB) |
| `database_schema` | Saved schema markdown + prompt snippet at blueprint time |

Schema source of truth: `scripts/schema.sql`. Existing DBs: `scripts/migrations/migrate-all.sql`.

---

## Application structure

```
app/
  page.tsx, start/page.tsx
  projects/[id]/layout.tsx      maxDuration=60, ProjectProvider
  projects/[id]/*               Thin route wrappers → WorkspaceFlow
  api/chat/route.ts             Streaming discovery (maxDuration=60)
  actions/projects.ts           Server actions + AI pipeline
  actions/billing.ts            Tier usage snapshot

components/
  landing/                      Marketing
  home/                         Idea intake, project list
  project/                      Journey UI (see below)
  billing/                      Tier notices

lib/
  ai/                           prompts, generate, model, errors, quota-retry, blueprint-context
  billing/                      tier limits, quota counting
  design/                       hydrate-design, schema-blueprint
  journey/                      navigation, status, prerequisites, specialists
  build-plan/                   Markdown export
  supabase/                     Admin client
```

### Project components (journey)

| Component | Role |
| --- | --- |
| `workspace-flow.tsx` | Switches view; shows placeholder vs full content |
| `stage-generate-panel.tsx` | Shared empty state + generate button + back link |
| `discovery-chat.tsx` | Streaming chat + generate requirements |
| `define-placeholder.tsx` | Empty define → generate requirements |
| `define-board.tsx` | Feature board when populated |
| `design-view.tsx` | DesignView + DesignPlaceholder + regenerate section |
| `blueprint-placeholder.tsx` | Empty blueprint → create blueprint |
| `build-plan.tsx` | Full blueprint (spec, flows, schema, foundation, cards, export) |
| `phase-nav.tsx` | Prev/next links (Define → Design is link only) |
| `overview-dashboard.tsx` | Journey progress + optional create blueprint |

---

## State management

| Concern | Approach |
| --- | --- |
| Server persistence | Supabase via `getSupabaseAdmin()` in server actions |
| Client state | `ProjectProvider` + `ProjectBundle` |
| Discovery chat | `@ai-sdk/react` `useChat` → `/api/chat` |
| Cache | `revalidatePath` + optimistic `setBundle` patches |

---

## AI pipeline

### Provider & models

```env
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash
```

- **Discover chat:** `resolveChatModel(modelId)` — picker in UI
- **Structured generation:** `BA_MODEL` from env
- **No multi-provider** — Ollama/OpenRouter/OpenAI removed

### Generation functions (`lib/ai/generate.ts`)

All structured calls go through `generateStructured()` → `withQuotaRetry()`.

| Function | Calls | Trigger |
| --- | --- | --- |
| Discovery chat (stream) | 1/msg | User sends message |
| `generateDiscoveryBundle` | 1 | Generate requirements |
| `generateDesign` | 1 | Create design flows |
| `generateBlueprintBatch` | 1–2 | Create blueprint |
| `generateFoundationPrompt` | 1 | Manual regenerate in UI |

### Blueprint batch input

`generateBlueprintBatch` receives via `BlueprintBatchInput`:

- `idea`, `req`, `mustFeatures`, `allFeatures`, `design`, `schemaBlueprint`
- Assembled prompt from `assembleBlueprintPromptContext()`
- Saves `foundation_prompt`, `database_schema`, feature cards with screens + user_journey

### Quota handling (`lib/ai/quota-retry.ts`)

- Detects 429 / quota errors
- Retries with delay (API hint + buffer, capped at 8s on Vercel)
- Max 2 attempts on Vercel, 3 locally
- Chat API: `maxRetries: 1` in route (no long sleeps)

### Structured output flow

```
Discover chat (DISCOVERY_SYSTEM)
    ↓ Generate requirements
generateDiscoveryBundle → requirements + features rows
    ↓ Create design flows (on Design page)
generateDesign → hydrateProductDesign → product_design jsonb
    ↓ Create blueprint (on Blueprint page)
generateBlueprintBatch → cards + foundation_prompt + database_schema
```

Schema blueprint is **derived** in `lib/design/schema-blueprint.ts` — not a separate AI call.

---

## Billing (`lib/billing/`)

| Check | Where |
| --- | --- |
| Project count | `createProject` |
| Blueprint count | `generateAndSaveCards` |
| UI snapshot | `getTierUsage()` → `/start`, blueprint placeholder |

Free: 1 project, 1 blueprint. Regenerate on same project allowed.

---

## Server actions (key)

| Action | Purpose |
| --- | --- |
| `finishDiscovery` | Bundle → requirements + features |
| `generateAndSaveDesign` | AI design → product_design |
| `generateAndSaveCards` | Full blueprint batch → cards + foundation + schema |
| `updateProjectTitle` | Overview title edit |
| `saveChat` / `saveProductDesign` | Persist edits |

Returns `BlueprintSaveResult` from `generateAndSaveCards`: `{ cards, features, foundation_prompt, database_schema }`.

---

## Styling tokens

- Error/alert text: `--alert-text` (dark burgundy) via `text-alert-text`
- Warning accents: `--warning` (yellow) for icons/borders only
- Pastels: mint, lilac, yellow stage accents

---

## Local dev

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm run build      # production build + typecheck
```

Demo: `scripts/seed-demo-project.sql` → `/projects/00000000-0000-4000-a800-000000000001`

---

## Related docs

- [Vision](./vision.md)
- [Decisions](./decisions.md)
- [Roadmap](./roadmap.md)
- [Project state](./project-state.md)
