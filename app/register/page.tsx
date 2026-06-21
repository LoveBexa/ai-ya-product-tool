import { BrandMark } from "@/components/brand-mark"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata = {
  title: "Create account — AIYA",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const nextPath = next?.startsWith("/") ? next : "/start"

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <BrandMark href="/" showTagline={false} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free to start — plan your MVP with AIYA.
          </p>
        </div>
        <AuthForm mode="register" nextPath={nextPath} />
      </main>
    </div>
  )
}
