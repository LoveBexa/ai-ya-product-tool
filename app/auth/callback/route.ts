import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { getPostLoginRedirectForUser } from "@/lib/auth/post-login-redirect"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const dest =
        user != null
          ? await getPostLoginRedirectForUser(user.id, next)
          : "/start"
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
