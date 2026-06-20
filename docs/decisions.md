# AIYA — Decisions

**Last updated:** June 19, 2026

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

**Decision:** User must click to advance. Discover can suggest readiness; Define must have must-haves before design; Overview triggers blueprint creation.

**Outcome:** `finishDiscovery` navigates to Define after generate. Design requires **Create design flows** click in phase nav. Blueprint requires **Create blueprint** on overview.

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

## AI & providers

### ADR-006: Google Gemini only

**Context:** Multi-provider setup (Ollama, OpenRouter, Gateway, OpenAI) added env complexity and deployment friction.

**Decision:** Remove all providers except Google Gemini via `@ai-sdk/google`.

**Outcome:** Single env var `GOOGLE_GENERATIVE_AI_API_KEY`. `lib/ai/model.ts` exports `resolveProvider(): "google"` only. README not yet updated.

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

**Outcome:** New prompts `DISCOVERY_OUTPUT_SYSTEM` and `QUEUE_BATCH_SYSTEM` in `prompts.ts`. Foundation prompt included in blueprint batch and saved to `projects.foundation_prompt` automatically.

Chat remains 1 call per message (cannot batch conversation).

---

### ADR-009: Fail fast on AI retries

**Context:** Long retry loops on quota errors felt broken and wasted time.

**Decision:** `maxRetries: 1` on all `generateText` and `streamText` calls.

**Outcome:** Faster failure → user sees `formatAiError` message with actionable guidance.

---

### ADR-010: Schema blueprint is derived, not generated

**Context:** Separate AI call for database schema would add cost and inconsistency with design.

**Decision:** Hydrate design from AI (`hydrate-design.ts`); derive tables from screens + must-have features (`schema-blueprint.ts`).

**Outcome:** Schema appears in Design and Blueprint export without extra API call. `projects.database_schema` column exists but is not the primary source.

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

**Outcome:** Requires migration on existing DBs. Included in `scripts/schema.sql`.

---

### ADR-013: Chat persisted on project row

**Context:** Discovery transcript must survive navigation and refresh.

**Decision:** `projects.chat jsonb` array of `{ role, content }`.

**Outcome:** Fixed bug where client bundle wasn't updated on save — now syncs via `setBundle` in discovery chat.

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

## DevOps

### ADR-020: Strict `.gitignore` for build artifacts

**Context:** `.next` was tracked (~3000 files); git push hung at ~97%.

**Decision:** `.gitignore` must include `node_modules/`, `.next/`, `dist/`, `build/`, `.vercel/`, `.env`, `.env.local`.

**Outcome:** Repo was re-initialized at one point — verify remote history is clean.

---

## Deferred / rejected (for now)

| Idea | Why deferred |
| --- | --- |
| Combine design + blueprint in one call | Different user review points; design edits before blueprint |
| Auto-generate design on Define navigation | Burns quota; user may want to edit features first |
| Keep multi-provider AI | Operational complexity; Gemini sufficient for MVP |
| Evolve stage in MVP | Focus on core Discover → Blueprint loop first |

---

## Related docs

- [Vision](./vision.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [Project state](./project-state.md)
