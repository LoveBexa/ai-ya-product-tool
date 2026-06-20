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

---

## What works today

End-to-end on a Supabase-backed project:

| Step | Route | User action | Output |
| --- | --- | --- | --- |
| **Start** | `/start` | Enter idea | New project |
| **Discover** | `/projects/[id]/discover` | Chat + **Generate requirements** | Requirements + feature list |
| **Define** | `/projects/[id]/define` | Edit must/nice/ignore board | MVP scope (or empty → generate) |
| **Design** | `/projects/[id]/design` | **Create design flows** | Flows, screens, schema |
| **Overview** | `/projects/[id]` | Optional **Create blueprint** | — |
| **Blueprint** | `/projects/[id]/execute` | **Create blueprint** | Full exportable build plan |

All data persists: chat, requirements, features, design, cards, foundation prompt, database_schema.

---

## Stage UX pattern (important)

Each pipeline stage follows the same pattern via `StageGeneratePanel` + `lib/journey/prerequisites.ts`:

1. **Empty page** — dashed placeholder + stage header
2. **Big generate button** — runs AI for that stage
3. **If prerequisites missing** — burgundy error + **Back to [stage]** link
4. **If success** — full content renders in place (no navigation required)

| Stage | Empty when | Generate button | Phase nav forward |
| --- | --- | --- | --- |
| Discover | Chat incomplete | **Generate requirements** (sidebar + inline) | — |
| Define | `features.length === 0` | **Generate requirements** | **Design flows** (link only) |
| Design | `design == null` | **Create design flows** | **Blueprint** (link) |
| Blueprint | No feature cards | **Create blueprint** | — |

**Design regenerate:** When design exists, bottom section offers **Re-generate design flows** with confirmation warning (overwrites flows, screens, schema; screen purpose edits lost).

**Define → Design:** Phase nav does **not** auto-generate design. It only links to `/design`.

---

## Free / Paid tier (billing)

Implemented in `lib/billing/` — **Paid tier UI not built yet**, limits enforced server-side.

| Tier | Projects | Blueprints |
| --- | --- | --- |
| **Free** (default) | 1 | 1 |
| **Paid** | Unlimited | Unlimited |

- Enforced in `createProject` and `generateAndSaveCards`
- UI notices via `TierLimitNotice` on `/start` and blueprint placeholder
- Set `AIYA_BILLING_TIER=paid` in env to disable limits (dev/testing)

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

### Blueprint generation context

`generateBlueprintBatch` receives **full pipeline context** via `lib/ai/blueprint-context.ts`:

- Requirements (Discover)
- All features: must / nice / ignore (Define)
- User flows, screens, workflow (Design)
- Derived schema snippet (Design)
- Outputs: foundation prompt, per-feature cards (goal, screens, acceptance criteria, AI prompts, verify), saves `database_schema`

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

Covers `product_design`, `cards` columns (`acceptance_criteria`, etc.), `foundation_prompt`, feature `verify`, etc.

**LocalStorage:** clear `aiya-discover-model` if model picker stuck on exhausted model.

---

## Deployment (Vercel)

- `npm run build` passes with TypeScript enabled (no `ignoreBuildErrors`)
- `next.config.mjs` — empty config (removed invalid Next 16 `eslint` key)
- `vercel.json` — `maxDuration: 60` for project routes + chat API
- `app/projects/[id]/layout.tsx` — `export const maxDuration = 60`
- **Required env vars on Vercel:** same as above
- Blueprint AI calls take 30–60s; Hobby plan may need Pro for reliable timeouts

---

## Key files

```
app/actions/projects.ts         Server actions, ProjectBundle, AI pipeline triggers
app/actions/billing.ts            getTierUsage()
lib/ai/generate.ts              All structured AI generation
lib/ai/blueprint-context.ts     Full-pipeline prompt assembly for blueprint
lib/ai/quota-retry.ts           Rate-limit retry (Vercel-safe caps)
lib/ai/prompts.ts               System prompts
lib/ai/model.ts                 Gemini model resolution
lib/journey/prerequisites.ts    Stage blocker logic
lib/journey/navigation.ts       Routes, labels, phase nav CTAs
lib/billing/tier.ts             Free/paid limits
components/project/workspace-flow.tsx   Routes views to content vs placeholders
components/project/stage-generate-panel.tsx   Shared empty-state UI
components/project/discovery-chat.tsx
components/project/define-placeholder.tsx
components/project/design-view.tsx      DesignView + DesignPlaceholder + regenerate
components/project/blueprint-placeholder.tsx
components/project/build-plan.tsx       Full blueprint after generation
scripts/schema.sql
scripts/migrations/migrate-all.sql
```

---

## Open issues / known gaps

| Priority | Issue |
| --- | --- |
| Medium | Discovery materials panel is UI mock only (no AI synthesis) |
| Medium | Evolve stage not implemented (metadata only) |
| Medium | Paid tier checkout / upgrade flow not built |
| Low | No CI, no automated tests |
| Low | Auth + RLS not implemented (service role everywhere) |
| Ops | Confirm Supabase migration run on production DB |
| Ops | Vercel Hobby may timeout on long blueprint generation |

---

## Recommended next actions

1. Run `scripts/migrations/migrate-all.sql` on production Supabase if not done
2. Set all env vars on Vercel; redeploy after latest main
3. Smoke test full journey on `gemini-2.0-flash` (pace discovery chat before blueprint)
4. Wire discovery materials → AI (first MVP+ feature)
5. Add auth + RLS before public launch

---

## Philosophy

> Build less. Think better. Ship with confidence.
