import type { ProductDesign, DesignTrace } from "@/lib/types/design"
import type { Feature } from "@/lib/types"

export function dogWalkingDesign(projectId: string): ProductDesign {
  const p = `design-${projectId}`
  const f = (n: number) => `design-feat-${projectId}-${n}`

  return {
    project_id: projectId,
    user_flow: [
      { id: `${p}-flow-0`, label: "Visitor", feature_ids: [] },
      { id: `${p}-flow-1`, label: "Sign up", feature_ids: [f(0)] },
      { id: `${p}-flow-2`, label: "Create account", feature_ids: [f(0)] },
      { id: `${p}-flow-3`, label: "Search walkers", feature_ids: [f(1)] },
      { id: `${p}-flow-4`, label: "View profile", feature_ids: [f(1)] },
      { id: `${p}-flow-5`, label: "Book walk", feature_ids: [f(2)] },
      { id: `${p}-flow-6`, label: "Pay", feature_ids: [f(2)] },
      { id: `${p}-flow-7`, label: "Leave review", feature_ids: [f(3)] },
    ],
    workflow: [
      { id: `${p}-wf-0`, label: "Booking created", feature_ids: [f(2)] },
      { id: `${p}-wf-1`, label: "Walker accepts", feature_ids: [f(2)] },
      { id: `${p}-wf-2`, label: "Booking confirmed", feature_ids: [f(2)] },
      { id: `${p}-wf-3`, label: "Walk completed", feature_ids: [f(3)] },
      { id: `${p}-wf-4`, label: "Review requested", feature_ids: [f(3)] },
    ],
    screens: [
      {
        id: `${p}-screen-landing`,
        name: "Landing page",
        purpose: "Explain the service and get owners to sign up.",
        feature_ids: [],
        user_flow_ids: [`${p}-flow-0`],
      },
      {
        id: `${p}-screen-signup`,
        name: "Sign up",
        purpose: "Owners and walkers create an account.",
        feature_ids: [f(0)],
        user_flow_ids: [`${p}-flow-1`, `${p}-flow-2`],
      },
      {
        id: `${p}-screen-dashboard`,
        name: "Dashboard",
        purpose: "Home after login — quick access to search and bookings.",
        feature_ids: [f(0)],
        user_flow_ids: [`${p}-flow-2`],
      },
      {
        id: `${p}-screen-search`,
        name: "Search",
        purpose: "Browse walkers nearby with filters.",
        feature_ids: [f(1)],
        user_flow_ids: [`${p}-flow-3`],
      },
      {
        id: `${p}-screen-profile`,
        name: "Walker profile",
        purpose: "See walker details, reviews, and book a walk.",
        feature_ids: [f(1), f(2)],
        user_flow_ids: [`${p}-flow-4`, `${p}-flow-5`],
      },
      {
        id: `${p}-screen-checkout`,
        name: "Checkout",
        purpose: "Confirm booking details and pay.",
        feature_ids: [f(2)],
        user_flow_ids: [`${p}-flow-6`],
      },
      {
        id: `${p}-screen-history`,
        name: "Booking history",
        purpose: "See upcoming and past walks; leave a review.",
        feature_ids: [f(2), f(3)],
        user_flow_ids: [`${p}-flow-5`, `${p}-flow-7`],
      },
    ],
    wireframes: [
      {
        id: `${p}-wf-signup`,
        screen_id: `${p}-screen-signup`,
        title: "Sign up layout",
        feature_ids: [f(0)],
        zones: [
          { label: "Owner / Walker tabs", variant: "header" },
          { label: "Email + password", variant: "form" },
          { label: "Create account", variant: "card" },
        ],
      },
      {
        id: `${p}-wf-dashboard`,
        screen_id: `${p}-screen-dashboard`,
        title: "Dashboard layout",
        feature_ids: [f(0)],
        zones: [
          { label: "Logo + menu", variant: "header" },
          { label: "Welcome message", variant: "hero" },
          { label: "Find walkers", variant: "card" },
          { label: "Upcoming walks", variant: "list" },
        ],
      },
      {
        id: `${p}-wf-search`,
        screen_id: `${p}-screen-search`,
        title: "Search layout",
        feature_ids: [f(1)],
        zones: [
          { label: "Search bar", variant: "search" },
          { label: "Walker cards", variant: "list" },
          { label: "Filter by area", variant: "form" },
        ],
      },
      {
        id: `${p}-wf-booking`,
        screen_id: `${p}-screen-profile`,
        title: "Booking layout",
        feature_ids: [f(2)],
        zones: [
          { label: "Walker photo + rating", variant: "hero" },
          { label: "Date & time picker", variant: "form" },
          { label: "Book walk button", variant: "card" },
        ],
      },
    ],
  }
}

/** Execute specs keyed by feature sort_order — trace pulled from design at build time. */
export const EXECUTE_BY_FEATURE_INDEX: Record<
  number,
  {
    goal: string
    implementation: string
    acceptance_criteria: string[]
    test_steps: string[]
  }
> = {
  0: {
    goal: "Owners and walkers can sign up, log in, and return to the app.",
    implementation:
      "Email/password auth with separate owner and walker sign-up. Store role on the user record and redirect to Dashboard after registration.",
    acceptance_criteria: [
      "User can create a dog owner account",
      "User can create a walker account",
      "User can log out and log back in",
    ],
    test_steps: [
      "Create an owner account",
      "Log out and log back in",
      "Repeat as a walker on your phone",
    ],
  },
  1: {
    goal: "Owners can find and compare walkers in their area.",
    implementation:
      "Searchable walker list with photo, star rating, and short bio. Filter by neighbourhood and link each card to a profile.",
    acceptance_criteria: [
      "User can search or filter by neighbourhood",
      "User sees walker photo, rating, and short bio",
      "User sees a clear message when no walkers are found",
    ],
    test_steps: [
      "Add three fake walkers",
      "Search your area",
      "Open a walker profile from the list",
    ],
  },
  2: {
    goal: "An owner books a walk and gets a clear confirmation.",
    implementation:
      "Booking form on the walker profile (date, time, notes). Create the booking, show confirmation, and list it in history.",
    acceptance_criteria: [
      "User can pick a date and time",
      "User sees a confirmation after booking",
      "Booking appears in their history",
    ],
    test_steps: [
      "Book a walk as an owner",
      "Check the confirmation screen",
      "Find the booking in history",
    ],
  },
  3: {
    goal: "Owners can rate a walk and help the next person decide.",
    implementation:
      "After a completed walk, show star rating and optional comment. Update the average on the walker profile.",
    acceptance_criteria: [
      "User can leave a star rating after a completed walk",
      "User can add an optional comment",
      "Average rating updates on the walker profile",
    ],
    test_steps: [
      "Mark a walk as complete",
      "Leave a review",
      "Check the walker's profile shows the new rating",
    ],
  },
}

/** Fill trace IDs from design for a feature at sort_order index. */
export function designTraceForFeature(
  projectId: string,
  feature: Feature,
  sortIndex: number,
): DesignTrace {
  const design = dogWalkingDesign(projectId)
  const spec = EXECUTE_BY_FEATURE_INDEX[sortIndex]
  const fid = feature.id

  const user_flow_ids = design.user_flow
    .filter((s) => s.feature_ids.includes(fid))
    .map((s) => s.id)
  const workflow_ids = design.workflow
    .filter((s) => s.feature_ids.includes(fid))
    .map((s) => s.id)
  const screen_ids = design.screens
    .filter((s) => s.feature_ids.includes(fid))
    .map((s) => s.id)
  const wireframe_ids = design.wireframes
    .filter((w) => w.feature_ids.includes(fid))
    .map((w) => w.id)

  return {
    feature_id: fid,
    user_flow_ids: spec ? user_flow_ids : [],
    workflow_ids: spec ? workflow_ids : [],
    screen_ids: spec ? screen_ids : [],
    wireframe_ids: spec ? wireframe_ids : [],
  }
}

export function buildExecuteCards(projectId: string, features: Feature[]) {
  const must = features
    .filter((f) => f.priority === "must")
    .sort((a, b) => a.sort_order - b.sort_order)
  const design = dogWalkingDesign(projectId)

  return must.map((feature, i) => {
    const spec = EXECUTE_BY_FEATURE_INDEX[feature.sort_order] ??
      EXECUTE_BY_FEATURE_INDEX[i] ?? {
        goal: `Deliver ${feature.name.toLowerCase()} in version one.`,
        implementation: `Implement ${feature.name.toLowerCase()} per the design flows and screens.`,
        acceptance_criteria: [`User can complete ${feature.name.toLowerCase()}`],
        test_steps: [`Verify ${feature.name.toLowerCase()} end to end`],
      }

    const trace = designTraceForFeature(projectId, feature, feature.sort_order)

    return { feature, trace, spec }
  })
}
