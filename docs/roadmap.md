# AIYA — Roadmap

**Last updated:** June 19, 2026

This roadmap reflects work completed in recent development (including Cursor-assisted sessions) and planned next steps.

---

## Shipped ✅

### Landing & app shell

- [x] Landing page: process narrative, contrast section, testimonials carousel
- [x] Sticky landing nav, solid black header, mobile-friendly layout
- [x] Project sidebar with AIYA branding; removed floating header inside projects
- [x] Project list + idea intake at `/start`
- [x] Setup notice when Supabase is not configured

### Overview

- [x] Journey progress ("Where am I?") with step states
- [x] **Editable project title** — inline edit, persists via `updateProjectTitle`
- [x] **Create blueprint** CTA when design is done → generates cards and navigates to execute

### Discover

- [x] Streaming Gemini chat with BA persona (one focused question at a time)
- [x] **Full-height chat layout** — viewport locked, messages scroll only
- [x] Chat transcript persisted to `projects.chat`
- [x] **Chat memory fix** — bundle syncs on save; no re-seed when saved chat exists
- [x] Chat error display via `formatAiError` (quota/rate-limit friendly)
- [x] **Generate requirements** button inline under assistant when ready
- [x] Same button in right sidebar above materials panel
- [x] Auto-navigate to `/define` after generate
- [x] Model picker (Gemini 2.0 / 2.5 Flash / 2.5 Pro)
- [x] Discovery materials panel UI (layout mock; upload metadata only)

### Define

- [x] Requirements brief (audience, problem, solution, revenue, success metric)
- [x] Feature board: must / nice / ignore with reasoning
- [x] Feature reorder and inline edits
- [x] Phase nav CTA renamed to **Create design flows** (`NEXT_STEP_CTA` in `lib/journey/navigation.ts`)

### Design

- [x] **Create design flows** wired — `generateAndSaveDesign` + `generateDesign` + `hydrateProductDesign`
- [x] Persisted to `projects.product_design` (jsonb)
- [x] Editable screen purposes (auto-save via `saveProductDesign`)
- [x] Schema blueprint derived from design + must-haves
- [x] Placeholder when user navigates to Design without generating first

### Blueprint (Execute)

- [x] Ordered feature cards: goal, acceptance criteria, test steps, dependencies, AI prompts
- [x] Per-feature verify strings
- [x] Foundation scaffolding prompt — **auto-generated with blueprint batch**; editable + regenerable in UI
- [x] Card status (todo / in_progress / done)
- [x] Feature reorder by dependencies
- [x] Markdown export (`assembleBuildPlanMarkdown`)
- [x] **Export button duplicated at bottom** of build plan

### AI & infrastructure

- [x] **Google Gemini only** — removed Ollama, OpenRouter, Gateway, OpenAI
- [x] Default model `gemini-2.0-flash` (better free-tier limits)
- [x] **`generateDiscoveryBundle`** — requirements + features in one call (was 2)
- [x] **`generateBlueprintBatch`** — all cards + foundation in one call (was N+1)
- [x] `maxRetries: 1` on AI calls
- [x] `.gitignore` fixed (`.next/`, env files, etc.)
- [x] Demo seed script (`scripts/seed-demo-project.sql`)
- [x] Project docs started (`docs/`)

---

## In progress / blocked ⚠️

| Item | Notes |
| --- | --- |
| Supabase `product_design` migration | Run `alter table projects add column if not exists product_design jsonb;` |
| TypeScript fix | `discovery-chat.tsx` ChatMessage role typing |
| README sync | Still mentions Ollama / multi-provider |
| Git remote hygiene | Confirm `.next` not in history after re-init |

---

## Next — immediate (ship-ready)

1. Run Supabase schema migration for `product_design`
2. Fix `discovery-chat.tsx` TypeScript error
3. Update `README.md` to match Google-only stack and `.env.example`
4. End-to-end test: new project → discover → define → design → blueprint on `gemini-2.0-flash`
5. Verify clean git push (no build artifacts tracked)

---

## Next — short term (MVP+)

| Feature | Description |
| --- | --- |
| **Discovery materials → AI** | Wire uploads to synthesis; feed context into discovery chat |
| **Evolve stage** | Route + AI flow for post-launch iteration (metadata exists, no live UI) |
| **Regenerate without losing edits** | Re-run design/blueprint while preserving manual screen/card edits |
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
