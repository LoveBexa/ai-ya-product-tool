# AIYA

**Clarity before code. Build with confidence.**

AIYA is an AI product partner for founders, indie hackers, and first-time builders. It helps you **think before you build** — turning messy ideas into a clear, editable **blueprint** you can hand to Cursor, Claude Code, v0, or your dev team.

AI can generate code in minutes. AIYA helps you figure out **what to build first**.

---

## The problem

AI solved building. The next challenge is helping people **think**.

Every AI builder assumes you already know what you're building:

> *"Describe your app."*

But most people don't start with a spec. They start with notes, conversations, screenshots, half-formed ideas, and questions they can't yet articulate.

When you skip the thinking stage, you get:

```
Build → discover missing requirements → rebuild → discover workflow issues → rebuild
```

Everyone is optimising for faster building. Almost nobody is optimising for **better thinking**.

---

## What AIYA does differently

| AI builders (Cursor, Bolt, Lovable…) | AIYA |
| --- | --- |
| Build faster | Think better |
| Generate software | Generate **understanding** |
| Short-term chat context | Long-term **product memory** |

AIYA doesn't replace coding tools — it gives them something worth building.

**The living product brain.** AIYA remembers your decisions, assumptions, priorities, workflows, and goals — so six months later you're not asking *"Why did we decide that?"*

---

## How it works

AIYA guides you through a structured journey. Each stage has a specialist AI role and a clear output:

| Stage | Role | What you get |
| --- | --- | --- |
| **Discover** | AI Business Analyst | Problem, audience, goals — through guided conversation (not a question dump) |
| **Define** | AI Product Manager | MVP cut: what must exist, what can wait, what to ignore |
| **Design** | AI UX Designer | User flows, screen inventory, and an inferred **schema blueprint** |
| **Blueprint** | AI Technical Lead | One exportable document: spec, data model, foundation prompt, and ordered feature steps |

The end goal is a **blueprint** — not code. A blueprint you can trust before you write a line.

Each stage shows an empty state with a generate button until you run that stage's AI step. Define → Design is a link only; design generation happens on the Design page.

The UI favours **progressive disclosure** — compact Kanban cards on Define, collapsible discovery context, and a focused chat layout — so you see summaries first and details when you choose.

### Coming soon (vision)

Import the messy stuff you've already created and let AIYA synthesise it:

- WhatsApp / Slack / Discord exports  
- Screenshots and wireframes  
- Sketches and whiteboard photos  
- ChatGPT and Claude conversation exports  

---

## Who it's for

- **Indie hackers** who move fast but don't want to lose direction  
- **First-time founders** turning ideas into real products  
- **AI builders** who need clarity on what they're actually shipping  
- **Small businesses** planning software before they invest  

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Vercel AI SDK** + **Google Gemini** (`@ai-sdk/google`)
- **Supabase** — project persistence (Postgres + JSONB)
- **Vercel** — hosting (`maxDuration: 60` for AI routes)

---

## Getting started

### Prerequisites

- Node.js 18+
- [Google AI Studio API key](https://aistudio.google.com/apikey)
- Supabase project (for saved projects)

### Install

```bash
git clone https://github.com/your-org/ai-ya-product-tool.git
cd ai-ya-product-tool
npm install
cp .env.example .env.local
```

### Configure `.env.local`

```env
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Optional — disable free tier limits for dev
# AIYA_BILLING_TIER=paid
```

### Database setup

New project — run `scripts/schema.sql` in Supabase SQL editor.

Existing database — run `scripts/migrations/migrate-all.sql` once.

Demo data: run `scripts/seed-demo-project.sql`, then open `/projects/00000000-0000-4000-a800-000000000001`.

### Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck
```

---

## Project structure

```
app/                    # Next.js routes (landing, /start, /projects/[id]/…)
components/
  landing/              # Marketing page
  project/              # Journey UI (discover, define, design, blueprint)
  billing/              # Tier limit notices
lib/
  ai/                   # Prompts, generation, quota retry, blueprint context
  billing/              # Free/paid tier limits
  design/               # Schema blueprint derivation from Design artifacts
  journey/              # Stage navigation, prerequisites, status
  build-plan/           # Blueprint markdown + Plainlang (.plain) export
  home/                 # Start page project card helpers
scripts/
  schema.sql            # Full Supabase schema
  migrations/           # Idempotent migrations for existing DBs
docs/                   # Handover docs — start at docs/project-state.md
```

---

## Documentation

| Doc | Purpose |
| --- | --- |
| [docs/project-state.md](docs/project-state.md) | **Start here** — current snapshot for handover |
| [docs/architecture.md](docs/architecture.md) | Stack, routes, AI pipeline, data model |
| [docs/roadmap.md](docs/roadmap.md) | Shipped features and backlog |
| [docs/decisions.md](docs/decisions.md) | ADR-style decision record |
| [docs/vision.md](docs/vision.md) | Product vision and north star |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Lint |

---

## Philosophy

> Build less. Think better. Ship with confidence.

AIYA is for the stage **before** the IDE. It's the product thinking layer — the missing planning stage that speed-focused AI tools removed.

When you're ready to code, you leave with a blueprint: audience, problem, MVP scope, flows, screens, schema, and feature prompts — not a blank chat window and a prayer.

---

## License

Private / hackathon project — update when ready for open source.
