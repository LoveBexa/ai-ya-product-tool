import { cn } from "@/lib/utils"

export function AiyaLogoIcon({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <line
        x1="12"
        y1="2.5"
        x2="12"
        y2="21.5"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <line
        x1="2.5"
        y1="12"
        x2="21.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <line
        x1="5.1"
        y1="5.1"
        x2="18.9"
        y2="18.9"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <line
        x1="18.9"
        y1="5.1"
        x2="5.1"
        y2="18.9"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
