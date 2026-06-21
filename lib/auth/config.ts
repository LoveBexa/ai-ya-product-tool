import { ACCOUNT_SUPPORT_EMAIL } from "./constants"

export function isAuthEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export { ACCOUNT_SUPPORT_EMAIL }
