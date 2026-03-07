import { Skeleton } from '@/components/ui/skeleton';

export function GuestEventPageSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(180deg,_#fffdf8_0%,_#fff7ed_40%,_#fff 100%)]">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-52 bg-stone-200" />
              <Skeleton className="h-4 w-36 rounded-full bg-stone-200" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl bg-amber-200/70" />
              <Skeleton className="h-10 w-28 rounded-xl bg-stone-200" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.9fr]">
          <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
            <div className="h-64 bg-gradient-to-br from-amber-100 via-rose-50 to-white p-6 sm:h-72 sm:p-8">
              <Skeleton className="h-10 w-3/4 max-w-xl bg-white/80" />
              <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-full bg-white/70" />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-full bg-white/60" />
              <div className="mt-8 flex flex-wrap gap-3">
                <Skeleton className="h-11 w-40 rounded-full bg-white/70" />
                <Skeleton className="h-11 w-36 rounded-full bg-white/60" />
                <Skeleton className="h-11 w-28 rounded-full bg-white/55" />
              </div>
            </div>
            <div className="grid gap-4 border-t border-stone-200/80 p-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-stone-50 p-4">
                  <Skeleton className="h-4 w-20 rounded-full bg-stone-200" />
                  <Skeleton className="mt-3 h-6 w-28 bg-stone-200" />
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(120,53,15,0.08)]">
            <Skeleton className="h-8 w-40 bg-stone-200" />
            <Skeleton className="mt-3 h-4 w-full rounded-full bg-stone-200" />
            <Skeleton className="mt-2 h-4 w-3/4 rounded-full bg-stone-200" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-stone-200/80 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl bg-stone-200" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28 rounded-full bg-stone-200" />
                      <Skeleton className="h-3 w-20 rounded-full bg-stone-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-xl bg-amber-200/70" />
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(120,53,15,0.08)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40 bg-stone-200" />
              <Skeleton className="h-4 w-52 rounded-full bg-stone-200" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl bg-stone-200" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-stone-50">
                <Skeleton className="aspect-[4/5] rounded-none bg-stone-200/90" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4 rounded-full bg-stone-200" />
                  <Skeleton className="h-3 w-24 rounded-full bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
