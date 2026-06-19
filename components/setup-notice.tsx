import { Database } from "lucide-react"
import { cn } from "@/lib/utils"

export function SetupNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-warning/40 bg-warning/10 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Connect your database to save projects
          </p>
          <p className="mt-1 text-muted-foreground">
            Add{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            as environment variables. The schema lives in{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              scripts/schema.sql
            </code>
            . Until then the AI pipeline runs but nothing persists.
          </p>
        </div>
      </div>
    </div>
  )
}
