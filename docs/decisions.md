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

**Decision:** **Generate requirements** appears under the ready assistant message AND at top of right sidebar above materials.

---

### ADR-017: Duplicate blueprint export button

**Context:** Long build plan page — export action only at top was easy to miss.

**Decision:** Duplicate export control at bottom of build plan.

---

### ADR-018: Project shell without floating header

**Context:** Redundant header inside project workspace.

**Decision:** AIYA branding in sidebar only; removed floating header inside projects.

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
