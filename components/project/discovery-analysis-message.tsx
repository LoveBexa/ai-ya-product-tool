/** Mock assistant message — materials analysed (UI only). */

export function DiscoveryAnalysisMessage() {
  return (
    <div className="max-w-[min(100%,36rem)] space-y-3 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground sm:max-w-[85%]">
      <p className="font-medium">I&apos;ve analysed your materials.</p>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Potential audience
        </p>
        <p className="mt-0.5">Busy dog owners</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Problem
        </p>
        <p className="mt-0.5">Finding trustworthy walkers</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested MVP
        </p>
        <p className="mt-0.5">Search · Profiles · Booking request</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Questions
        </p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
          <li>Do payments happen in the app?</li>
          <li>How are walkers verified?</li>
        </ul>
      </div>
    </div>
  )
}
