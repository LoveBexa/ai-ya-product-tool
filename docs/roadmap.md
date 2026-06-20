# AIYA — Roadmap

**Last updated:** June 20, 2026

This roadmap reflects work completed in recent development (including Cursor-assisted sessions) and planned next steps.

---

## Shipped ✅

### Landing & app shell

- [x] Landing page: process narrative, contrast section, testimonials carousel
- [x] Sticky landing nav, solid black header, mobile-friendly layout
- [x] Project sidebar with AIYA branding; removed floating header inside projects
- [x] Project list + idea intake at `/start`
- [x] Setup notice when Supabase is not configured
- [x] **Free tier notices** on `/start` and blueprint placeholder (`TierLimitNotice`)

### Overview

- [x] Journey progress ("Where am I?") with step states
- [x] **Editable project title** — inline edit, persists via `updateProjectTitle`
- [x] **Create blueprint** CTA when design is done → generates cards and navigates to execute

### Discover

- [x] Streaming Gemini chat with BA persona (one focused question at a time)
- [x] **Full-height chat layout** — viewport locked, messages scroll only
- [x] Chat transcript persisted to `projects.chat`
- [x] **Chat memory fix** — bundle syncs on save; no re-seed when saved chat exists
- [x] Chat error display via `formatAiError` (quota/rate-limit friendly, burgundy `text-alert-text`)
- [x] **Generate requirements** button inline under assistant when ready
- [x] Same button in right sidebar above materials panel
- [x] Auto-navigate to `/define` after generate
- [x] Model picker (Gemini 2.0 / 2.5 Flash / 2.5 Pro)
- [x] Discovery materials panel UI (layout mock; upload metadata only)
- [x] **"Not finished yet" banner** when chat incomplete

### Define

- [x] Requirements brief (audience, problem, solution, revenue, success metric)
- [x] Feature board: must / nice / ignore with reasoning
- [x] Feature reorder and inline edits
- [x] **DefinePlaceholder** — empty state + generate requirements when no features
- [x] Phase nav CTA: **Design flows** (link only — does not generate design)

### Design

- [x] **Create design flows** on Design page — `generateAndSaveDesign` + `generateDesign` + `hydrateProductDesign`
- [x] Persisted to `projects.product_design` (jsonb)
- [x] Editable screen purposes (auto-save via `saveProductDesign`)
- [x] Schema blueprint derived from design + must-haves
- [x] **DesignPlaceholder** — empty state + prerequisite blockers + back link
- [x] **Re-generate design flows** with confirmation warning when design exists

### Blueprint (Execute)

- [x] Ordered feature cards: goal, acceptance criteria, test steps, dependencies, AI prompts
- [x] Per-feature verify strings
- [x] Foundation scaffolding prompt — auto-generated with blueprint batch; editable + regenerable in UI
- [x] **Full pipeline context** in blueprint generation (requirements, all features, design, schema)
- [x] Saves `database_schema` at blueprint time
- [x] **BlueprintPlaceholder** — empty state + tier limit notice + generate button
- [x] Card status (todo / in_progress / done)
- [x] Feature reorder by dependencies
- [x] Markdown export (`assembleBuildPlanMarkdown`) — richer export with flows and full card details
- [x] **Export button duplicated at bottom** of build plan
- [x] Build plan shows user flows, screens, schema, foundation, cards

### Billing

- [x] Free tier: 1 project, 1 blueprint (regenerate same project OK)
- [x] Paid tier placeholder via `AIYA_BILLING_TIER=paid` env
- [x] Server-side enforcement in `createProject` and `generateAndSaveCards`
- [x] `getTierUsage()` for UI notices

### AI & infrastructure

- [x] **Google Gemini only** — removed Ollama, OpenRouter, Gateway, OpenAI
- [x] Default model `gemini-2.0-flash` (better free-tier limits)
- [x] **`generateDiscoveryBundle`** — requirements + features in one call (was 2)
- [x] **`generateBlueprintBatch`** — all cards + foundation in one call (was N+1)
- [x] **`lib/ai/blueprint-context.ts`** — assembles full prior-stage context for blueprint
- [x] **`withQuotaRetry`** — auto-retry on 429 with Vercel-safe caps (8s max wait, 2 attempts)
- [x] `maxDuration: 60` on project layout + `vercel.json` for long blueprint calls
- [x] `.gitignore` fixed (`.next/`, env files, etc.)
- [x] Demo seed script (`scripts/seed-demo-project.sql`)
- [x] **Migration bundle** `scripts/migrations/migrate-all.sql` for existing DBs
- [x] TypeScript build passes (`npm run build`)
- [x] Next.js 16 config cleaned (removed invalid `eslint` key)
- [x] Project docs in `docs/`

### Shared UX pattern

- [x] **`StageGeneratePanel`** — consistent empty state + generate + blocker → back link
- [x] **`lib/journey/prerequisites.ts`** — stage prerequisite checks
- [x] **`workspace-flow.tsx`** — routes to placeholders vs full content per stage

---

## In progress / blocked ⚠️

| Item | Notes |
| --- | --- |
| Supabase migration on production | Run `scripts/migrations/migrate-all.sql` if not done |
| Vercel Hobby timeouts | Blueprint AI may exceed 60s on slow quota retries — may need Pro |
| Paid tier checkout | Limits enforced; no payment / upgrade UI |

---

## Next — immediate (ship-ready)

1. Confirm `scripts/migrations/migrate-all.sql` run on production Supabase
2. Set all env vars on Vercel; redeploy latest main
3. End-to-end smoke test on deployed Vercel with `gemini-2.0-flash`
4. Pace discovery chat before blueprint to avoid quota exhaustion

---

## Next — short term (MVP+)

| Feature | Description |
| --- | --- |
| **Discovery materials → AI** | Wire uploads to synthesis; feed context into discovery chat |
| **Evolve stage** | Route + AI flow for post-launch iteration (metadata exists, no live UI) |
| **Paid tier upgrade UI** | Stripe or similar; replace env-only `AIYA_BILLING_TIER=paid` |
| **Regenerate without losing edits** | Re-run blueprint while preserving manual card edits |
| **Batch error recovery** | Retry UI when blueprint batch misses a feature name |
| **Quota UX** | Debounce chat, show pacing hints, document limits in UI |

---

## Next — medium term

| Feature | Description |
| --- | --- |
| **Auth + RLS** | User accounts; stop using service role for everything |
| **Product memory** | Blueprint versioning, decision log, "why did we decide that?" |
| **Export formats** | Notion, PDF in addition to markdown |
| **CI** | Typecheck + lint on PR |
| **File preview** | Materials panel currently shows "coming soon" |

---

## Next — long term (vision)

- Import pipeline: WhatsApp/Slack exports, screenshots, sketches, prior AI chats
- Evolve: feedback loops, analytics-informed roadmap suggestions
- Cross-project learning and templates
- Collaboration (shared projects, comments)

---

## Stage completion criteria (current logic)

From `lib/journey/status.ts`:

| Step | "Done" when |
| --- | --- |
| Discover | Requirements exist OR stage past discovery |
| Define | At least one must-have feature |
| Design | Blueprint cards exist OR design artifact present (heuristic) |
| Blueprint | Feature cards generated; optionally all cards marked done |

Journey heuristics may not match user mental model in edge cases — worth revisiting.

---

## Related docs

- [Vision](./vision.md)
- [Architecture](./architecture.md)
- [Decisions](./decisions.md)
- [Project state](./project-state.md)
