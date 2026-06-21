import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isAuthEnabled } from "@/lib/auth/config"
import { getPostLoginRedirectForUser } from "@/lib/auth/post-login-redirect"

const PUBLIC_PREFIXES = ["/login", "/register", "/auth/", "/api/"]
const PUBLIC_EXACT = new Set(["/"])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  )
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/start" ||
    pathname.startsWith("/start/") ||
    pathname.startsWith("/projects/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  )
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isAuthEnabled()) {
    return response
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, searchParams } = request.nextUrl

  // Supabase sometimes redirects OAuth to Site URL (/) with ?code= — forward to our handler.
  if (pathname === "/" && searchParams.has("code")) {
    const callback = request.nextUrl.clone()
    callback.pathname = "/auth/callback"
    return NextResponse.redirect(callback)
  }

  if (!user && isProtectedPath(pathname) && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const next = request.nextUrl.searchParams.get("next")
    const destPath = await getPostLoginRedirectForUser(user.id, next, supabase)
    const dest = request.nextUrl.clone()
    dest.pathname = destPath
    dest.search = ""
    return NextResponse.redirect(dest)
  }

  // Signed-in users hitting the marketing homepage → app workspace.
  if (user && pathname === "/" && !searchParams.has("code")) {
    const destPath = await getPostLoginRedirectForUser(user.id, "/start", supabase)
    const dest = request.nextUrl.clone()
    dest.pathname = destPath
    dest.search = ""
    return NextResponse.redirect(dest)
  }

  return response
}
