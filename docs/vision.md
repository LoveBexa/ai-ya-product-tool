# AIYA — Vision

**Tagline:** *Clarity before code. Build with confidence.*

**Last updated:** June 19, 2026

---

## What AIYA is

AIYA is an **AI product partner** for founders, indie hackers, and first-time builders. It helps you **think before you build** — turning messy ideas into a clear, editable **blueprint** you can hand to Cursor, Claude Code, v0, or your dev team.

AI can generate code in minutes. AIYA helps you figure out **what to build first**.

AIYA does not replace coding tools. It gives them something worth building.

---

## The problem

Every AI builder assumes you already know what you're building:

> *"Describe your app."*

Most people don't start with a spec. They start with notes, conversations, screenshots, half-formed ideas, and questions they can't yet articulate.

When you skip the thinking stage:

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
| Short-term chat context | Long-term **product memory** (vision) |

AIYA owns the stage **before** the IDE — the missing planning layer that speed-focused tools removed.

---

## The journey

Each stage has a specialist AI role and a clear output:

| Stage | Role | What you get |
| --- | --- | --- |
| **Discover** | AI Business Analyst | Problem, audience, goals — through guided conversation (not a question dump) |
| **Define** | AI Product Manager | MVP cut: what must exist, what can wait, what to ignore |
| **Design** | AI UX Designer | User flows, screen inventory, and an inferred **schema blueprint** |
| **Blueprint** | AI Technical Lead | One exportable document: spec, data model, foundation prompt, and ordered feature steps |

The end goal is a **blueprint** — not code. A blueprint you can trust before you write a line.

Handoffs are deliberate: the user clicks **Generate requirements**, then **Create design flows**, then **Create blueprint**. AIYA does not auto-advance through stages without explicit action.

---

## Who it's for

- **Indie hackers** who move fast but don't want to lose direction
- **First-time founders** turning ideas into real products
- **AI builders** who need clarity on what they're actually shipping
- **Small businesses** planning software before they invest

---

## The living product brain (north star)

AIYA should remember your decisions, assumptions, priorities, workflows, and goals — so six months later you're not asking *"Why did we decide that?"*

Today the app persists requirements, features, design, cards, and chat per project in Supabase. Full **product memory** (versioning, change history, cross-project learning) is future work.

---

## Coming soon (vision, not built)

### Import messy inputs

Synthesise what founders already have:

- WhatsApp / Slack / Discord exports
- Screenshots and wireframes
- Sketches and whiteboard photos
- ChatGPT and Claude conversation exports

The Discover stage already has a **materials panel UI shell** (upload zone, tabs for chat/sketches/drawings). Uploads currently create mock metadata only — AI synthesis is not wired yet.

### Evolve stage

Post-launch iteration: feedback, insights, and what to build next.

Stage metadata exists in `lib/journey/specialists.ts` (`evolve` — AI Product Strategist). There is no live route or AI flow in the current codebase.

---

## Philosophy

> Build less. Think better. Ship with confidence.

When you're ready to code, you leave with a blueprint: audience, problem, MVP scope, flows, screens, schema, and feature prompts — not a blank chat window and a prayer.

---

## Related docs

- [Architecture](./architecture.md) — how it's built today
- [Roadmap](./roadmap.md) — what's done and what's next
- [Decisions](./decisions.md) — key product and technical choices
- [Project state](./project-state.md) — current snapshot for handover
