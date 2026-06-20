import { BrandMark } from "@/components/brand-mark"

export function AppShell({
  children,
  showHeader = true,
}: {
  children: React.ReactNode
  showHeader?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader ? (
        <header className="sticky top-0 z-30 border-b border-mint/35 bg-background/80 backdrop-blur-md">
          <div className="bg-mint/[0.06]">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
              <BrandMark href="/start" showTagline={false} />
            </div>
          </div>
        </header>
      ) : null}
      <main className="flex-1">{children}</main>
    </div>
  )
}
