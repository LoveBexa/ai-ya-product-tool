# AIYA — Decisions

**Last updated:** June 20, 2026

Record of significant product and technical decisions, including changes made during recent Cursor development sessions.

Format: **Decision** → Context → Outcome

---

## Product

### ADR-001: Blueprint over code

**Context:** AI coding tools (Cursor, v0, Bolt) generate software directly. Founders still skip planning.

**Decision:** AIYA stops at an exportable blueprint — spec, schema, foundation prompt, ordered feature steps. No application code generation.

**Outcome:** Clear positioning as the stage *before* the IDE. Complements rather than competes with coding tools.

---

### ADR-002: Specialist persona per stage

**Context:** One generic chatbot would blur discovery, scoping, UX, and technical planning.

**Decision:** Each journey stage has a dedicated system prompt and AI role (BA → PM → UX → Tech Lead). Handoffs require explicit user actions.

**Outcome:** Prompts in `lib/ai/prompts.ts`. UI buttons: **Generate requirements** → **Create design flows** → **Create blueprint**.

---

### ADR-003: Explicit handoffs, no auto-advance

**Context:** Auto-running AI between stages burns quota and skips user review.

**Decision:** User must click to advance. Discover can suggest readiness; Define must have must-haves before design; generation happens on each stage's page, not via phase nav.

**Outcome:** `finishDiscovery` navigates to Define after generate. Define phase nav is **Design flows** (link only). Design generation only on `/design`. Blueprint on overview or `/execute`.

---

### ADR-004: User-facing "Blueprint" vs internal "execute"

**Context:** "Execute" is accurate internally but confusing for founders.

**Decision:** UI label **Blueprint**; route `/execute`; internal stage id `execute`.

**Outcome:** `STOP_LABEL.execute = "Blueprint"` in `lib/journey/navigation.ts`. Older `/build` path still matched for compatibility.

---

### ADR-005: Define replaces Decide

**Context:** Route was previously `/decide`.

**Decision:** Primary route is `/define`. Navigation regex still matches `/decide` for old links.

---

### ADR-021: Stage generate panel pattern

**Context:** Empty stages were confusing — users didn't know what to do or why generation failed.

**Decision:** Every pipeline stage uses the same empty-state UX: dashed placeholder, big generate button, prerequisite error with **Back to [stage]** link.

**Outcome:** `StageGeneratePanel` + `lib/journey/prerequisites.ts`. Placeholders: `DefinePlaceholder`, `DesignPlaceholder`, `BlueprintPlaceholder`. `workspace-flow.tsx` switches between placeholder and full content.

---

### ADR-022: Design generation only on Design page

**Context:** Phase nav "Create design flows" from Define auto-generated design and burned quota before user reviewed features.

**Decision:** Define → Design phase nav is a **link only** (`NEXT_STEP_CTA.define = "Design flows"`). User must click **Create design flows** on the Design page.

**Outcome:** Generation removed from Define nav. Regenerate available on Design page with confirmation warning.

---

### ADR-023: Free / paid tier limits

**Context:** Need to gate usage before payment integration exists.

**Decision:** Free tier: 1 project, 1 blueprint. Paid tier via `AIYA_BILLING_TIER=paid` env (unlimited). Regenerate blueprint on same project allowed on Free.

**Outcome:** `lib/billing/tier.ts`, `quota.server.ts`, `TierLimitNotice` UI. No Stripe yet.

---

## AI & providers

### ADR-006: Google Gemini only

**Context:** Multi-provider setup (Ollama, OpenRouter, Gateway, OpenAI) added env complexity and deployment friction.

**Decision:** Remove all providers except Google Gemini via `@ai-sdk/google`.

**Outcome:** Single env var `GOOGLE_GENERATIVE_AI_API_KEY`. `lib/ai/model.ts` exports `resolveProvider(): "google"` only. README updated.

---

### ADR-007: Default model `gemini-2.0-flash`

**Context:** Users hit free-tier limits on `gemini-2.5-flash` (~20 req/min). Separate quota per model.

**Decision:** Default `GOOGLE_MODEL=gemini-2.0-flash`. In-app picker still offers 2.5 Flash and 2.5 Pro.

**Outcome:** Documented in `.env.example`. `formatAiError()` suggests switching models on quota errors.

---

### ADR-008: Batched structured generation

**Context:** User requested reducing API intensity / Gemini quota usage.

**Decision:** Combine related structured outputs into single calls:

| Flow | Before | After | Function |
| --- | --- | --- | --- |
| Finish discovery | 2 calls | 1 | `generateDiscoveryBundle` |
| Create blueprint | N+1 calls | 1 | `generateBlueprintBatch` |

**Outcome:** New prompts in `prompts.ts`. Foundation prompt included in blueprint batch and saved to `projects.foundation_prompt` automatically.

Chat remains 1 call per message (cannot batch conversation).

---

### ADR-009: Quota retry with Vercel-safe caps

**Context:** Initial auto-retry slept 48s+ inside serverless functions, causing Vercel timeouts. Users also wanted automatic retry on 429.

**Decision:** `withQuotaRetry()` in `lib/ai/quota-retry.ts`:
- Max wait capped at 8s on Vercel, 2 attempts
- Local dev: up to 3 attempts with longer waits
- Chat API keeps `maxRetries: 1` (no long sleeps in stream route)

**Outcome:** Structured generation retries without blowing serverless timeout. `maxDuration: 60` on project layout + `vercel.json`.

---

### ADR-010: Schema blueprint is derived, saved at blueprint time

**Context:** Separate AI call for database schema would add cost and inconsistency with design.

**Decision:** Hydrate design from AI (`hydrate-design.ts`); derive tables from screens + must-have features (`schema-blueprint.ts`). Save snapshot to `projects.database_schema` when blueprint is generated.

**Outcome:** Schema appears in Design and Blueprint export without extra API call. Blueprint batch receives schema snippet via `lib/ai/blueprint-context.ts`.

---

### ADR-024: Blueprint uses full pipeline context

**Context:** Blueprint cards were generated from must-haves only, missing design flows and nice-to-have context.

**Decision:** `generateBlueprintBatch` receives requirements, all features (must/nice/ignore), design artifact, and derived schema via `assembleBlueprintPromptContext()`.

**Outcome:** Richer cards with screens, user journey, acceptance criteria. Build plan export includes flows and full card details.

---

## Data & persistence

### ADR-011: Supabase with service role (no auth yet)

**Context:** MVP needed persistence quickly.

**Decision:** Server actions use Supabase admin client. No user auth or RLS.

**Outcome:** Project pages require Supabase env vars. Landing works without DB. Auth is roadmap item.

---

### ADR-012: Design stored as JSONB on project

**Context:** Design artifact (flows, screens) is document-like, not relational.

**Decision:** `projects.product_design jsonb` column. Hydrated `ProductDesign` type in `lib/types/design.ts`.

**Outcome:** Requires migration on existing DBs. Included in `scripts/schema.sql` and `scripts/migrations/migrate-all.sql`.

---

### ADR-013: Chat persisted on project row

**Context:** Discovery transcript must survive navigation and refresh.

**Decision:** `projects.chat jsonb` array of `{ role, content }`.

**Outcome:** Fixed bug where client bundle wasn't updated on save — now syncs via `setBundle` in discovery chat.

---

### ADR-025: Consolidated DB migration script

**Context:** Existing Supabase DBs missing `product_design`, `cards` columns (`card_type`, `acceptance_criteria`, etc.), causing runtime errors.

**Decision:** Single idempotent migration bundle at `scripts/migrations/migrate-all.sql` (includes 001, 002).

**Outcome:** Run once in Supabase SQL editor on existing deployments. Quota counting no longer filters on missing `card_type`.

---

## UI & UX

### ADR-014: Full-height discovery chat

**Context:** Chat felt cramped; page scrolled awkwardly.

**Decision:** Viewport-locked layout in discover view — header/chrome fixed, messages area scrolls.

**Outcome:** Changes in `discovery-chat.tsx`, `project-shell.tsx`.

---

### ADR-015: Editable project title on overview

**Context:** Auto-generated title from idea snippet was not editable.

**Decision:** Inline editable title on overview; `updateProjectTitle` server action; state via `ProjectProvider`.

**Outcome:** Removed duplicate `bundle` prop from `OverviewDashboard`.

---

### ADR-016: Generate requirements in two places

**Context:** Users might miss the inline chat button.

**Decision:** **Generate requirements** appears in the Discover header row AND inline under the ready assistant message (sidebar is materials/outputs only).

**Outcome:** `discovery-chat.tsx` header + inline CTA.

---

### ADR-017: Duplicate blueprint export button

**Context:** Long build plan page — export action only at top was easy to miss.

**Decision:** Duplicate export control at bottom of build plan.

---

### ADR-018: Project shell navigation

**Context:** Redundant header inside project workspace; full-width content without nav lost journey context.

**Decision (evolved):** Top sticky header with AIYA logo + account menu. Desktop left sidebar for journey steps. Mobile bottom journey bar.

**Outcome:** `project-shell.tsx`, `project-sidebar-nav.tsx`, `project-bottom-bar.tsx`, `account-menu.tsx`.

---

### ADR-019: Discovery materials UI as layout mock

**Context:** Vision includes importing messy inputs; full pipeline not ready.

**Decision:** Ship panel UI (tabs, upload zone, sample materials) with mock metadata only. No AI synthesis yet.

**Outcome:** `discovery-materials-panel.tsx`, `discovery-upload-zone.tsx`. Preview shows "coming soon".

---

### ADR-026: Burgundy alert text for errors

**Context:** Error messages used yellow `text-warning`, which looked like warnings not errors.

**Decision:** Add `--alert-text` CSS token (dark burgundy); use `text-alert-text` on error messages.

**Outcome:** `app/globals.css`. Applied in `StageGeneratePanel`, discovery chat, and generate error surfaces.

---

### ADR-028: Progressive disclosure on Define board

**Context:** Define screen showed problem statement, summary box, tip, column hints, feature titles, multi-line descriptions, and move buttons simultaneously — felt like project-management software, not an AI thinking partner.

**Decision:** Collapse non-primary content; show title-only Kanban cards; open **`FeatureDetailPanel`** drawer on click for description and moves; collapse Discovery summary in `<details>`; replace summary box with one-line counts.

**Outcome:** `define-board.tsx`. Internal field `reasoning` remains the description — hidden on cards, editable in drawer. Drag via grip handle preserved.

---

### ADR-029: Permanent Discover sidebar (desktop)

**Context:** Toggling "Outputs" added chrome; users wanted materials and outputs always visible while chatting.

**Decision:** On `lg+`, right sidebar always shows **Your materials** then **Discovery outputs** — no toggle. Chat stays centered `max-w-xl` in left column.

**Outcome:** `discovery-chat.tsx` grid layout. Mobile: sidebar hidden until a mobile pattern is designed.

---

### ADR-030: Dual navigation — sidebar + bottom bar

**Context:** Full-width content without nav was tried; users lost journey context.

**Decision:** Desktop: left `ProjectSidebarNav`. Mobile: `ProjectBottomBar` journey circles. Shared top header with `AccountMenu`.

**Outcome:** `project-shell.tsx`, `project-sidebar-nav.tsx`, `project-bottom-bar.tsx`. Phase nav still at bottom of main content (except Discover viewport lock).

---

### ADR-031: Compact stage headers

**Context:** Large stage headers consumed vertical space on chat-heavy screens.

**Decision:** Add `compact` prop to `StageHeader` for Discover and Define — single-line title + short subtitle.

**Outcome:** `stage-header.tsx`. Full-size header still used on placeholders and other stages where appropriate.

---

### ADR-032: Plainlang export format

**Context:** Users may want formal spec output for codeplain / ***plain tooling, not only markdown PRD.

**Decision:** Add second export format alongside Blueprint markdown: **Plainlang spec** (`.plain`) assembled from blueprint cards and schema.

**Outcome:** `lib/build-plan/plainlang-export.ts`, `export-formats.ts`. UI format picker + **Copy all** in `build-plan.tsx` export modal.

---

### ADR-033: Temp free-tier project limit for testing

**Context:** Need to test multi-project flows before paid tier exists.

**Decision:** Set `FREE_MAX_PROJECTS = 2` in `lib/billing/tier.ts` with TEMP comment. UI copy and `TIER_MESSAGES` still say 1 project.

**Outcome:** Revert to `1` before public launch; document in project-state and roadmap.

---

## DevOps

### ADR-020: Strict `.gitignore` for build artifacts

**Context:** `.next` was tracked (~3000 files); git push hung at ~97%.

**Decision:** `.gitignore` must include `node_modules/`, `.next/`, `dist/`, `build/`, `.vercel/`, `.env`, `.env.local`.

**Outcome:** Repo was re-initialized at one point — verify remote history is clean.

---

### ADR-027: Vercel function duration for AI routes

**Context:** Blueprint generation takes 30–60s; default 10s Vercel timeout fails.

**Decision:** `export const maxDuration = 60` on `app/projects/[id]/layout.tsx`. `vercel.json` sets 60s for project routes and chat API.

**Outcome:** Blueprint and design generation can complete on Vercel Hobby (may still need Pro for edge cases).

---

## Deferred / rejected (for now)

| Idea | Why deferred |
| --- | --- |
| Combine design + blueprint in one call | Different user review points; design edits before blueprint |
| Auto-generate design on Define navigation | Burns quota; user may want to edit features first (rejected in ADR-022) |
| Keep multi-provider AI | Operational complexity; Gemini sufficient for MVP |
| Evolve stage in MVP | Focus on core Discover → Blueprint loop first |
| Long quota retry sleeps on Vercel | Causes serverless timeout; capped at 8s (ADR-009) |

---

## Related docs

- [Vision](./vision.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [Project state](./project-state.md)
