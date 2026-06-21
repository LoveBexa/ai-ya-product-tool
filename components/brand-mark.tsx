import Link from "next/link"
import { AiyaLogoIcon } from "@/components/aiya-logo-icon"
import { cn } from "@/lib/utils"

export function BrandMark({
  href = "/",
  showTagline = true,
  compact = false,
  dark = false,
  className,
}: {
  href?: string
  showTagline?: boolean
  compact?: boolean
  dark?: boolean
  className?: string
}) {
  const iconSize = compact ? "h-7 w-7" : "h-8 w-8"
  const wordmarkSize = compact
    ? "text-sm leading-none"
    : showTagline
      ? "text-base"
      : "text-lg leading-none"

  const content = (
    <>
      <AiyaLogoIcon
        className={cn(
          iconSize,
          dark ? "text-brand-mark-on-dark" : "text-brand-mark",
        )}
      />
      <span className={cn("min-w-0", !showTagline && "flex items-center")}>
        <span
          className={cn(
            "font-bold tracking-[0.14em]",
            dark ? "text-white" : "text-foreground",
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
