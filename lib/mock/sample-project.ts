import type { ChatMessage, Requirements, Feature } from "@/lib/types"
import { buildQueueCards } from "./build-pipeline-cards"

/** Seed / reference data for the demo Dog Walking project. */
export function dogWalkingChat(): ChatMessage[] {
  return [
    {
      role: "user",
      content:
        "A app that helps dog owners find trusted local dog walkers and book walks easily.",
    },
    {
      role: "assistant",
      content:
        "Nice idea. Who needs this most — busy dog owners, walkers looking for clients, or both?",
    },
    {
      role: "user",
      content:
        "Mostly busy owners who don't have time to walk their dog every day.",
    },
    {
      role: "assistant",
      content:
        "Got it. How do they solve that today — friends, agencies, or just struggling without help?",
    },
    {
      role: "user",
      content:
        "Usually word of mouth or random people on Facebook groups. Hard to know who's trustworthy.",
    },
    {
      role: "assistant",
      content:
        "That helps a lot. When you know it's working, what would success look like — your first happy customer doing what?",
    },
    {
      role: "user",
      content:
        "An owner finds a walker nearby, books a walk, and comes back because they felt safe.",
    },
    {
      role: "assistant",
      content:
        "Perfect. Tap Finish discovery when you're ready to define what ships first.",
    },
  ]
}

export function sampleChat(_idea: string): ChatMessage[] {
  return dogWalkingChat()
}

export function sampleRequirements(projectId: string): Requirements {
  return {
    id: `design-req-${projectId}`,
    project_id: projectId,
    audience:
      "Busy dog owners who need someone trustworthy to walk their dog during the week.",
    problem:
      "Finding a reliable walker is stressful — owners rely on word of mouth or strangers online with no real way to check trust.",
    solution:
      "Owners search by location; walkers will create profiles; reviews are enough to build trust initially.",
    revenue_model:
      "Take a small fee on each booked walk. Walkers can pay later for extra visibility.",
    success_metric:
      "An owner completes their first booked walk and leaves a review.",
    created_at: new Date().toISOString(),
  }
}

export function dogWalkingFeatures(projectId: string): Feature[] {
  const rows = [
    {
      name: "Sign up & log in",
      priority: "must" as const,
      reasoning: "Owners and walkers both need their own account.",
      sort_order: 0,
    },
    {
      name: "Find walkers nearby",
      priority: "must" as const,
      reasoning: "Owners need to see who's available in their area.",
      sort_order: 1,
    },
    {
      name: "Book a walk",
      priority: "must" as const,
      reasoning: "This is the main thing you're testing — can someone actually book?",
      sort_order: 2,
    },
    {
      name: "Leave a review",
      priority: "must" as const,
      reasoning: "Reviews help owners trust walkers they've never met before.",
      sort_order: 3,
    },
    {
      name: "Chat in the app",
      priority: "nice" as const,
      reasoning: "Handy later — not needed to prove people will book.",
      sort_order: 4,
    },
    {
      name: "Video meet-and-greet",
      priority: "ignore" as const,
      reasoning: "Fun idea, but too much for the first version.",
      sort_order: 5,
    },
  ]
  return rows.map((row) => ({
    ...row,
    id: `design-feat-${projectId}-${row.sort_order}`,
    project_id: projectId,
    verify:
      row.priority === "must"
        ? `Smoke-test "${row.name}" end-to-end; refresh the page and confirm the happy path still works.`
        : "",
    created_at: new Date().toISOString(),
  }))
}

export function sampleFeatures(projectId: string): Feature[] {
  return dogWalkingFeatures(projectId)
}

export function sampleCards(projectId: string, features: Feature[]) {
  return buildQueueCards(projectId, features)
}
