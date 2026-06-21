# AIYA — Roadmap

**Last updated:** June 20, 2026

This roadmap reflects work completed in recent development (including Cursor-assisted sessions) and planned next steps.

---

## Shipped ✅

### Landing & app shell

- [x] Landing page: process narrative, contrast section, testimonials carousel
- [x] Sticky landing nav, solid black header, mobile-friendly layout
- [x] **Top project header** — AIYA logo + `AccountMenu` (name dropdown)
- [x] **Desktop sidebar nav** — `ProjectSidebarNav` (Overview, Discover, Define, Design, Blueprint)
- [x] **Mobile bottom journey bar** — `ProjectBottomBar` with step circles (`lg:hidden`)
- [x] Project list + idea intake at `/start`
- [x] Setup notice when Supabase is not configured
- [x] **Free tier notices** on `/start` and blueprint placeholder (`TierLimitNotice`, `TierPlanBadge`)

### Start page (simplified)

- [x] ChatGPT-like layout — headline, example pills, auto-expanding textarea
- [x] **Start Planning →** + **Upload Files** CTAs
- [x] Subtitle: *AI can write code in minutes. AIYA helps you decide what to build first.*
- [x] **Your projects** — emoji titles, last-edited, blueprint progress bar (mint fill), **Continue** button
- [x] `lib/home/project-card-meta.ts` — emoji, progress %, relative timestamps

### Overview

- [x] **The pipeline** — merged journey section with descriptive step labels
- [x] **Editable project title** — auto-resizing textarea, persists via `updateProjectTitle`
- [x] **Create blueprint** CTA when design is done → generates cards and navigates to execute

### Discover

- [x] Streaming Gemini chat with BA persona (one focused question at a time)
- [x] **Full-height chat layout** — viewport locked on Discover, messages scroll only
- [x] Chat transcript persisted to `projects.chat`
- [x] **Chat memory fix** — bundle syncs on save; no re-seed when saved chat exists
- [x] Chat error display via `formatAiError` (quota/rate-limit friendly, burgundy `text-alert-text`)
- [x] **Generate requirements** — header button + inline under ready assistant message
- [x] Auto-navigate to `/define` after generate
- [x] Model picker (Gemini 2.0 / 2.5 Flash / 2.5 Pro)
- [x] **Compact `StageHeader`** + inline In progress / Complete status pill
- [x] Chat centered at `max-w-xl` (matches start page width)
- [x] **Permanent desktop sidebar** — **Your materials** + **Discovery outputs** (no toggle)
- [x] Materials/outputs panels `compact` mode
- [x] Discovery materials panel UI (layout mock; upload metadata only)
- [x] Removed **Not finished yet** yellow banner

### Define

- [x] Requirements brief (audience, problem, solution, revenue, success metric)
- [x] Feature board: must / nice / ignore with reasoning (stored; not shown on cards)
- [x] **Compact Kanban UI** — title-only cards, grip drag, many features per column
- [x] **`FeatureDetailPanel`** drawer — description, rename, move between columns
- [x] **Collapsible Discovery summary** (`<details>`, collapsed by default)
- [x] **One-line counts** — `X Must exist · Y Later · Z Ignore` + short MVP tip
- [x] **Compact `StageHeader`**
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
- [x] Markdown export (`assembleBuildPlanMarkdown`)
- [x] **Plainlang spec export** (`assemblePlainlangSpec` → `.plain`) via format picker
- [x] **Export format registry** — `lib/build-plan/export-formats.ts`
- [x] **Copy all** in export preview modal
- [x] Export button duplicated at bottom of build plan
- [x] Build plan shows user flows, screens, schema, foundation, cards

### Billing

- [x] Free tier: 1 blueprint (regenerate same project OK); UI copy says 1 project
- [x] **TEMP:** `FREE_MAX_PROJECTS = 2` for local testing in `tier.ts`
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
- [x] Project docs in `docs/`

### Shared UX pattern

- [x] **`StageGeneratePanel`** — consistent empty state + generate + blocker → back link
- [x] **`StageHeader compact`** — smaller headers on Discover/Define
- [x] **`lib/journey/prerequisites.ts`** — stage prerequisite checks
- [x] **`workspace-flow.tsx`** — routes to placeholders vs full content per stage
- [x] **Progressive disclosure** — Define cards, Discovery summary, export modal

---

## In progress / blocked ⚠️

| Item | Notes |
| --- | --- |
| Discover mobile sidebar | Materials/outputs only on `lg+` — need drawer or tabs on mobile |
| Supabase migration on production | Run `scripts/migrations/migrate-all.sql` if not done |
| Vercel Hobby timeouts | Blueprint AI may exceed 60s on slow quota retries — may need Pro |
| Paid tier checkout | Limits enforced; no payment / upgrade UI |
| Free tier project limit | Revert `FREE_MAX_PROJECTS` from 2 → 1 before launch |

---

## Next — immediate (ship-ready)

1. Smoke test full journey on desktop + mobile (especially Discover without sidebar on mobile)
2. Confirm `scripts/migrations/migrate-all.sql` run on production Supabase
3. Set all env vars on Vercel; redeploy latest main
4. Revert temp `FREE_MAX_PROJECTS = 2` when testing complete

---

## Next — short term (MVP+)

| Feature | Description |
| --- | --- |
| **Discovery materials → AI** | Wire uploads to synthesis; feed context into discovery chat |
| **Mobile Discover panels** | Drawer or bottom sheet for materials + outputs |
| **Generate MVP Spec** | Optional CTA on Define (user mockup — not built) |
| **Evolve stage** | Route + AI flow for post-launch iteration (metadata exists, no live UI) |
| **Paid tier upgrade UI** | Stripe or similar; replace env-only `AIYA_BILLING_TIER=paid` |
| **Regenerate without losing edits** | Re-run blueprint while preserving manual card edits |
| **Quota UX** | Debounce chat, show pacing hints, document limits in UI |

---

## Next — medium term

| Feature | Description |
| --- | --- |
| **Auth + RLS** | User accounts; stop using service role for everything |
| **Product memory** | Blueprint versioning, decision log, "why did we decide that?" |
| **More export formats** | Notion, PDF in addition to markdown + plainlang |
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

---

## Related docs

- [Vision](./vision.md)
- [Architecture](./architecture.md)
- [Decisions](./decisions.md)
- [Project state](./project-state.md)
