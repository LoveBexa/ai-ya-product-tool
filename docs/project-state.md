# AIYA — Project State

**Snapshot for handover** · Last updated: June 20, 2026

Start here when picking up this repo. Deeper detail in sibling docs:

| Doc | Contents |
| --- | --- |
| [vision.md](./vision.md) | Product vision, problem, philosophy, north star |
| [architecture.md](./architecture.md) | Stack, routes, data model, AI pipeline |
| [roadmap.md](./roadmap.md) | Shipped features, backlog, priorities |
| [decisions.md](./decisions.md) | ADR-style record of choices made |

---

## One-line summary

AIYA is a Next.js + Supabase + Gemini app that guides founders from idea → requirements → MVP scope → UX design → exportable blueprint. Each pipeline stage has an **empty state + generate button** pattern; generation pulls context from all prior stages.

**Recent focus:** UI simplification — progressive disclosure, compact stage headers, Kanban-style Define board, permanent Discover sidebar on desktop, dual navigation (sidebar + mobile bottom bar), Plainlang export.

---

## What works today

End-to-end on a Supabase-backed project:

| Step | Route | User action | Output |
| --- | --- | --- | --- |
| **Start** | `/start` | Enter idea (+ optional uploads UI) | New project |
| **Discover** | `/projects/[id]/discover` | Chat + **Generate requirements** | Requirements + feature list |
| **Define** | `/projects/[id]/define` | Prioritise must/later/ignore board | MVP scope (or empty → generate) |
| **Design** | `/projects/[id]/design` | **Create design flows** | Flows, screens, schema |
| **Overview** | `/projects/[id]` | Optional **Create blueprint** | — |
| **Blueprint** | `/projects/[id]/execute` | **Create blueprint** | Full exportable build plan |

All data persists: chat, requirements, features, design, cards, foundation prompt, database_schema.

---

## UI / UX (current)

Design intent: **AI helped me think** — not a heavy ticket board. Fewer visible cards, progressive disclosure, expandable details.

### App shell (`project-shell.tsx`)

| Breakpoint | Navigation |
| --- | --- |
| **Desktop (`lg+`)** | Top header (AIYA logo + `AccountMenu`) + left `ProjectSidebarNav` (Overview, Discover, Define, Design, Blueprint) |
| **Mobile** | Same top header + `ProjectBottomBar` journey circles (hidden on `lg+`) |

Discover locks viewport height (`h-dvh`) so chat scrolls inside the pane, not the whole page.

### Start (`/start`)

- ChatGPT-like intake: headline, example pills, auto-expanding textarea, **Start Planning →**, **Upload Files**
- Subtitle: *"AI can write code in minutes. AIYA helps you decide what to build first."*
- **Your projects** list: emoji title, relative last-edited, blueprint progress %, mint **Continue** button
- `TierPlanBadge` when user can still create (copy: **1 project · 1 blueprint**)

### Discover

- `StageHeader compact` + inline **In progress** / **Complete** pill (yellow / mint)
- Chat centered at `max-w-xl`; **Generate requirements** in header + inline under ready assistant message
- **Desktop sidebar (always visible):** `Your materials` (`DiscoveryMaterialsPanel`) then **Discovery outputs** (`DiscoveryLearnings`) — no toggle
- Materials/outputs panels support `compact` prop
- Removed yellow **Not finished yet** banner
- **Mobile:** sidebar hidden (`hidden lg:flex`) — materials/outputs not shown on small screens yet

### Define

- `StageHeader compact`
- **Discovery summary** — `<details>` collapsed by default (problem handoff)
- One-line counts: `X Must exist · Y Later · Z Ignore` + short MVP tip
- **Compact Kanban cards:** grip handle + title only; click opens **`FeatureDetailPanel`** drawer (description, rename, move to Later / Ignore / Must exist)
- Drag-and-drop between columns via grip handle
- Column labels: **Must exist** / **Later** / **Ignore** (internal priority keys unchanged: `must` / `nice` / `ignore`)

### Blueprint export

- Format picker in export modal: **Blueprint** (`.md`) and **Plainlang spec** (`.plain`)
- **Copy all** button in export preview modal
- Registry: `lib/build-plan/export-formats.ts`, assembler: `lib/build-plan/plainlang-export.ts`

### Overview

- Merged journey into single **The pipeline** section with step labels like *Discover — problem and audience clear*
- Editable project title (auto-resizing textarea)

---

## Stage UX pattern (important)

Each pipeline stage follows the same pattern via `StageGeneratePanel` + `lib/journey/prerequisites.ts`:

1. **Empty page** — dashed placeholder + stage header
2. **Big generate button** — runs AI for that stage
3. **If prerequisites missing** — burgundy error + **Back to [stage]** link
4. **If success** — full content renders in place (no navigation required)

| Stage | Empty when | Generate button | Phase nav forward |
| --- | --- | --- | --- |
| Discover | Chat incomplete | **Generate requirements** (header + inline) | — |
| Define | `features.length === 0` | **Generate requirements** | **Design flows** (link only) |
| Design | `design == null` | **Create design flows** | **Blueprint** (link) |
| Blueprint | No feature cards | **Create blueprint** | — |

**Design regenerate:** When design exists, bottom section offers **Re-generate design flows** with confirmation warning.

**Define → Design:** Phase nav does **not** auto-generate design. It only links to `/design`.

---

## Free / Paid tier (billing)

Implemented in `lib/billing/` — **Paid tier UI not built yet**, limits enforced server-side.

| Tier | Projects (UI copy) | Projects (enforced) | Blueprints |
| --- | --- | --- | --- |
| **Free** | 1 | **2** (TEMP — see below) | 1 |
| **Paid** | Unlimited | Unlimited | Unlimited |

- Enforced in `createProject` and `generateAndSaveCards`
- UI notices via `TierLimitNotice` / `TierPlanBadge` on `/start` and blueprint placeholder
- Set `AIYA_BILLING_TIER=paid` in env to disable limits (dev/testing)
- **TEMP:** `FREE_MAX_PROJECTS = 2` in `lib/billing/tier.ts` for local testing — revert to `1` before launch; UI messages still say 1 project

Regenerating blueprint on the **same** project is allowed on Free.

---

## AI & quota

- **Provider:** Google Gemini only (`@ai-sdk/google`)
- **Default model:** `gemini-2.0-flash` via `GOOGLE_MODEL`
- **Discover chat:** User picks model in UI (`localStorage` key `aiya-discover-model`)
- **Structured steps:** Use `BA_MODEL` from env (not chat picker)
- **Quota retry:** `lib/ai/quota-retry.ts` — auto-retries on 429 with capped waits (8s max on Vercel, 2 attempts)
- **Errors:** `formatAiError()` in `lib/ai/errors.ts` — burgundy `text-alert-text` in UI

### API call budget (happy path)

| Step | Gemini calls |
| --- | --- |
| Discovery chat | ~5–15 |
| Generate requirements | 1 |
| Create design flows | 1 |
| Create blueprint | 1 |
| **Structured total** | **3** |

---

## Environment checklist

```env
# Required for AI
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash

# Required for saved projects
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Optional — billing (default: free)
# AIYA_BILLING_TIER=paid
```

### Supabase migration (existing DBs)

Run once in Supabase SQL editor:

```
scripts/migrations/migrate-all.sql
```

**LocalStorage:** clear `aiya-discover-model` if model picker stuck on exhausted model.

---

## Key files

```
app/actions/projects.ts              Server actions, ProjectBundle, AI pipeline triggers
app/actions/billing.ts               getTierUsage()
lib/ai/generate.ts                   All structured AI generation
lib/ai/blueprint-context.ts          Full-pipeline prompt assembly for blueprint
lib/ai/quota-retry.ts                Rate-limit retry (Vercel-safe caps)
lib/journey/prerequisites.ts         Stage blocker logic
lib/billing/tier.ts                  Free/paid limits (FREE_MAX_PROJECTS temp = 2)
lib/build-plan/export-formats.ts     Blueprint + Plainlang export registry
lib/build-plan/plainlang-export.ts   ***plain spec assembler
lib/home/project-card-meta.ts        Project list emoji, progress, last-edited
components/home/idea-intake.tsx      Start page intake
components/home/projects-home.tsx    Start page project list
components/project/project-shell.tsx Top header + sidebar + bottom bar layout
components/project/project-sidebar-nav.tsx   Desktop journey nav
components/project/project-bottom-bar.tsx    Mobile journey nav
components/project/account-menu.tsx          User dropdown (Settings/Logout placeholders)
components/project/stage-header.tsx          Stage title; `compact` prop for Discover/Define
components/project/discovery-chat.tsx        Chat + permanent desktop sidebar
components/project/discovery-materials-panel.tsx
components/project/discovery-learnings.tsx     "Discovery outputs" panel
components/project/define-board.tsx          Compact Kanban + FeatureDetailPanel drawer
components/project/overview-dashboard.tsx
components/project/build-plan.tsx            Export modal, format picker, Copy all
components/project/workspace-flow.tsx        Routes views to content vs placeholders
scripts/migrations/migrate-all.sql
```

---

## Open issues / known gaps

| Priority | Issue |
| --- | --- |
| Medium | Discovery materials panel is UI mock only (no AI synthesis) |
| Medium | Discover materials/outputs sidebar hidden on mobile — need mobile pattern |
| Medium | Evolve stage not implemented (metadata only) |
| Medium | Paid tier checkout / upgrade flow not built |
| Low | **Generate MVP Spec** CTA on Define not implemented (mockup only) |
| Low | Revert `FREE_MAX_PROJECTS` to 1 before launch; align UI copy |
| Low | No CI, no automated tests |
| Low | Auth + RLS not implemented (service role everywhere) |
| Ops | Confirm Supabase migration run on production DB |
| Ops | Vercel Hobby may timeout on long blueprint generation |

---

## Recommended next actions

1. Smoke test Discover + Define on desktop and mobile (sidebar gap on mobile)
2. Revert `FREE_MAX_PROJECTS` to 1 when testing done; keep docs in sync
3. Wire discovery materials → AI (first MVP+ feature)
4. Optional: mobile Discover drawer for materials/outputs
5. Optional: **Generate MVP Spec** button on Define (navigate to Design or trigger spec preview)
6. Add auth + RLS before public launch

---

## Philosophy

> Build less. Think better. Ship with confidence.

UI should feel like **AI helped me think** — progressive disclosure over showing every explanation at once.
