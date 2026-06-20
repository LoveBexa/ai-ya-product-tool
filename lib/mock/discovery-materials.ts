export type MaterialCategory = "chat" | "sketches" | "drawings"

export interface DiscoveryMaterial {
  id: string
  name: string
  category: MaterialCategory
  kind: string
  meta?: string
}

export const SAMPLE_MATERIALS: DiscoveryMaterial[] = [
  {
    id: "mat-1",
    name: "owner-walker-thread.txt",
    category: "chat",
    kind: "WhatsApp export",
    meta: "48 messages",
  },
  {
    id: "mat-2",
    name: "chatgpt-marketplace-idea.md",
    category: "chat",
    kind: "ChatGPT export",
    meta: "12 prompts",
  },
  {
    id: "mat-3",
    name: "lovable-first-pass.txt",
    category: "chat",
    kind: "Lovable prompt",
    meta: "UI experiment",
  },
  {
    id: "mat-4",
    name: "napkin-sketch-booking.jpg",
    category: "sketches",
    kind: "Photo · whiteboard",
    meta: "2.1 MB",
  },
  {
    id: "mat-5",
    name: "paper-flow-sketch.jpg",
    category: "sketches",
    kind: "Drawing · paper",
    meta: "1.4 MB",
  },
  {
    id: "mat-6",
    name: "figma-v1-screens.png",
    category: "drawings",
    kind: "Figma export",
    meta: "Wireframes",
  },
  {
    id: "mat-7",
    name: "chatgpt-ui-screenshot.png",
    category: "drawings",
    kind: "Screenshot",
    meta: "Generated UI",
  },
]

export const MATERIAL_TABS: { id: MaterialCategory; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "sketches", label: "Sketches" },
  { id: "drawings", label: "Drawings" },
]
