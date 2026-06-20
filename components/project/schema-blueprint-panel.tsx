"use client"

import type { SchemaBlueprint } from "@/lib/design/schema-blueprint"

export function SchemaBlueprintPanel({
  blueprint,
  compact = false,
}: {
  blueprint: SchemaBlueprint
  compact?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[280px] text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-3 py-2 font-semibold uppercase tracking-wide text-muted-foreground">
                Design screen
              </th>
              <th className="px-3 py-2 font-semibold uppercase tracking-wide text-muted-foreground">
                Likely tables
              </th>
            </tr>
          </thead>
          <tbody>
            {blueprint.screenMap.map((row) => (
              <tr key={row.screen} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium">{row.screen}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {row.tables}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {blueprint.tables.map((table) => (
          <div
            key={table.name}
            className="rounded-xl border border-border bg-secondary/20 p-3"
          >
            <p className="font-mono text-sm font-semibold">{table.name}</p>
            <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-muted-foreground">
              {table.columns.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
            {table.features.length > 0 && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">MVP</span>{" "}
                {table.features.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {!compact && (
        <div className="rounded-xl border border-lilac/30 bg-lilac/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lilac-foreground">
            AI prompt snippet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste into Cursor, Claude Code, or v0 when scaffolding the database.
          </p>
          <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-card p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {blueprint.promptSnippet}
          </pre>
        </div>
      )}
    </div>
  )
}
