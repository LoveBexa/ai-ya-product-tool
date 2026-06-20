export function sampleFoundationPrompt(projectTitle: string): string {
  return `Scaffold "${projectTitle}" as a Next.js App Router app with Supabase.

Use the schema blueprint from Design (flows + screens + MVP features) for your migrations — start with profiles/auth, then add feature tables as you build.

Set up:
- TypeScript, Tailwind, and a simple app shell with sidebar navigation placeholders
- Supabase project with auth-ready users table and a profiles row per user
- Environment variables documented in .env.example (Supabase URL, anon key)
- Deploy target: Vercel with preview deployments

Deliver a running home route that confirms auth wiring works (signed-out landing, signed-in blank dashboard shell). Do not implement search, booking, or reviews yet — those come in feature build steps.`
}
