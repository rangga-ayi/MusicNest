export default function Loading() {
  return (
    <div className="space-y-12 animate-pulse" aria-busy="true" aria-label="Memuat konten...">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
          {/* Artwork placeholder */}
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl bg-surface-hover shrink-0" />
          <div className="flex-1 w-full pb-2 space-y-4">
            <div className="h-3 w-20 rounded bg-surface-hover" />
            <div className="h-9 sm:h-12 w-3/4 rounded-lg bg-surface-hover" />
            <div className="h-4 w-1/2 rounded bg-surface-hover" />
            <div className="h-10 w-32 rounded-full bg-surface-hover mt-6" />
          </div>
        </div>
      </section>

      {/* Album grid skeleton */}
      <section>
        <div className="h-6 w-36 rounded bg-surface-hover mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-3 space-y-3">
              <div className="aspect-square w-full rounded-lg bg-surface-hover" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-surface-hover" />
                <div className="h-3 w-1/2 rounded bg-surface-hover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent songs skeleton */}
      <section>
        <div className="h-6 w-28 rounded bg-surface-hover mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface/60 border border-border/60">
              <div className="w-10 h-10 rounded bg-surface-hover shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3.5 w-1/2 rounded bg-surface-hover" />
                <div className="h-2.5 w-1/3 rounded bg-surface-hover" />
              </div>
              <div className="h-3 w-8 rounded bg-surface-hover shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
