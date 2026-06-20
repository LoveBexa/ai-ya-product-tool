import { cn } from "@/lib/utils"
import { TIER_UPGRADE_NOTE } from "@/lib/billing/tier"

export function TierLimitNotice({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-lilac/40 bg-lilac/10 p-4 text-sm",
        className,
      )}
      role="status"
    >
      <p className="font-medium text-foreground">Free plan limit</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">{message}</p>
      <p className="mt-2 text-xs text-muted-foreground">{TIER_UPGRADE_NOTE}</p>
    </div>
  )
}

export function TierPlanBadge({
  tierLabel,
  planSummary,
  className,
}: {
  tierLabel: string
  planSummary: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {tierLabel} plan · {planSummary}
    </span>
  )
}
