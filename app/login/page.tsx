import { BrandMark } from "@/components/brand-mark"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata = {
  title: "Sign in — AIYA",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const nextPath = next?.startsWith("/") ? next : "/start"

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <BrandMark href="/" showTagline={false} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue planning your product.
          </p>
          {error === "auth" && (
            <p className="mt-3 text-sm text-alert-text">
              Sign-in failed. Please try again.
            </p>
          )}
        </div>
        <AuthForm mode="login" nextPath={nextPath} />
      </main>
    </div>
  )
}
