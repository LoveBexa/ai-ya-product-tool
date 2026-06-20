import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({
  href = "/",
  showTagline = true,
  compact = false,
  className,
}: {
  href?: string
  showTagline?: boolean
  compact?: boolean
  className?: string
}) {
  const logoSize = compact ? "h-7 w-7" : "h-8 w-8"
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4"
  const wordmarkSize = compact
    ? "text-sm leading-none"
    : showTagline
      ? "text-base"
      : "text-lg leading-none"

  const content = (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-mint ring-1 ring-mint/40",
          logoSize,
        )}
      >
        <Sparkles className={cn("text-mint-foreground", iconSize)} />
      </span>
      <span className={cn("min-w-0", !showTagline && "flex items-center")}>
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            showTagline && "block",
            wordmarkSize,
          )}
        >
          AIYA
        </span>
        {showTagline && (
          <span
            className={cn(
              "block truncate text-muted-foreground",
              compact ? "text-[10px]" : "text-xs sm:text-sm",
            )}
          >
            Your AI product partner
          </span>
        )}
      </span>
    </>
  )

  const classes = cn("flex min-w-0 items-center gap-2.5", className)

  if (href) {
    return (
      <Link href={href} className={cn(classes, "transition-opacity hover:opacity-90")}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
