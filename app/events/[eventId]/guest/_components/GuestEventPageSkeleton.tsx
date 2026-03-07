import { Skeleton } from '@/components/ui/skeleton';
import type { CSSProperties } from 'react';
import { getGuestThemeStyleVars, type GuestTheme } from '../_lib/guest-theme';

type GuestEventPageSkeletonProps = {
  theme?: GuestTheme | null;
};

export function GuestEventPageSkeleton({ theme }: GuestEventPageSkeletonProps) {
  const styleVars = theme ? (getGuestThemeStyleVars(theme) as CSSProperties) : undefined;

  return (
    <div
      className="min-h-screen"
      style={{
        ...styleVars,
        background:
          'var(--guest-skeleton-page-bg, radial-gradient(circle at top, rgba(15,23,42,0.06), transparent 35%), #F8FAFC)',
      }}
    >
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--guest-skeleton-header-bg, rgba(255,255,255,0.88))',
          borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-52" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
              <Skeleton className="h-4 w-36 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl" style={{ backgroundColor: 'var(--guest-skeleton-secondary, rgba(139,92,246,0.18))' }} />
              <Skeleton className="h-10 w-28 rounded-xl" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.9fr]">
          <section
            className="overflow-hidden rounded-[2rem] border"
            style={{
              borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))',
              backgroundColor: 'var(--guest-skeleton-surface-bg, rgba(255,255,255,0.92))',
              boxShadow: '0 24px 80px var(--guest-skeleton-shadow, rgba(15,23,42,0.08))',
            }}
          >
            <div
              className="h-64 p-6 sm:h-72 sm:p-8"
              style={{
                background:
                  'var(--guest-skeleton-hero-bg, linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(203,213,225,0.12) 48%, rgba(255,255,255,0.96) 100%))',
              }}
            >
              <Skeleton className="h-10 w-3/4 max-w-xl" style={{ backgroundColor: 'var(--guest-skeleton-surface-72, rgba(255,255,255,0.72))' }} />
              <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-surface-60, rgba(255,255,255,0.6))' }} />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-surface-52, rgba(255,255,255,0.52))' }} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Skeleton className="h-11 w-40 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-surface-58, rgba(255,255,255,0.58))' }} />
                <Skeleton className="h-11 w-36 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-surface-50, rgba(255,255,255,0.5))' }} />
                <Skeleton className="h-11 w-28 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-surface-45, rgba(255,255,255,0.45))' }} />
              </div>
            </div>
            <div className="grid gap-4 border-t p-6 sm:grid-cols-3" style={{ borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))' }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--guest-skeleton-soft-surface, rgba(148,163,184,0.08))' }}>
                  <Skeleton className="h-4 w-20 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
                  <Skeleton className="mt-3 h-6 w-28" style={{ backgroundColor: 'var(--guest-skeleton-primary, rgba(139,92,246,0.18))' }} />
                </div>
              ))}
            </div>
          </section>

          <aside
            className="rounded-[2rem] border p-6"
            style={{
              borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))',
              backgroundColor: 'var(--guest-skeleton-surface-bg, rgba(255,255,255,0.92))',
              boxShadow: '0 20px 60px var(--guest-skeleton-shadow, rgba(15,23,42,0.08))',
            }}
          >
            <Skeleton className="h-8 w-40" style={{ backgroundColor: 'var(--guest-skeleton-primary, rgba(139,92,246,0.18))' }} />
            <Skeleton className="mt-3 h-4 w-full rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
            <Skeleton className="mt-2 h-4 w-3/4 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border p-4" style={{ borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))' }}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl" style={{ backgroundColor: 'var(--guest-skeleton-primary, rgba(139,92,246,0.18))' }} />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
                      <Skeleton className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-xl" style={{ backgroundColor: 'var(--guest-skeleton-secondary, rgba(139,92,246,0.18))' }} />
          </aside>
        </div>

        <section
          className="mt-8 rounded-[2rem] border p-6"
          style={{
            borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))',
            backgroundColor: 'var(--guest-skeleton-surface-bg, rgba(255,255,255,0.92))',
            boxShadow: '0 20px 60px var(--guest-skeleton-shadow, rgba(15,23,42,0.08))',
          }}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" style={{ backgroundColor: 'var(--guest-skeleton-primary, rgba(139,92,246,0.18))' }} />
              <Skeleton className="h-4 w-52 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: 'var(--guest-skeleton-border, rgba(15,23,42,0.12))', backgroundColor: 'var(--guest-skeleton-soft-surface, rgba(148,163,184,0.08))' }}>
                <Skeleton
                  className="aspect-[4/5] rounded-none"
                  style={{
                    backgroundColor:
                      index % 3 === 0
                        ? 'var(--guest-skeleton-primary, rgba(139,92,246,0.18))'
                        : index % 3 === 1
                          ? 'var(--guest-skeleton-secondary, rgba(236,72,153,0.18))'
                          : 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))',
                  }}
                />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
                  <Skeleton className="h-3 w-24 rounded-full" style={{ backgroundColor: 'var(--guest-skeleton-neutral, rgba(15,23,42,0.08))' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
