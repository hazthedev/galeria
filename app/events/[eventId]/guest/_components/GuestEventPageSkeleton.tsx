import { Skeleton } from '@/components/ui/skeleton';
import type { GuestThemeSnapshot } from '../_lib/guest-theme-cache';
import { hexToRgba } from '../_lib/guest-utils';

type GuestEventPageSkeletonProps = {
  theme?: GuestThemeSnapshot | null;
};

export function GuestEventPageSkeleton({ theme }: GuestEventPageSkeletonProps) {
  const themePrimary = theme?.themePrimary || '#8B5CF6';
  const themeSecondary = theme?.themeSecondary || '#EC4899';
  const themeBackground = theme?.themeBackground || '#F9FAFB';
  const themeSurface = theme?.themeSurface || '#FFFFFF';
  const surfaceText = theme?.surfaceText || '#0F172A';
  const headerBackground = theme?.headerBackground || hexToRgba(themeSurface, 0.88);
  const surfaceBorder = theme?.surfaceBorder || 'rgba(15,23,42,0.12)';
  const primarySkeleton = hexToRgba(themePrimary, 0.18);
  const secondarySkeleton = hexToRgba(themeSecondary, 0.18);
  const neutralSkeleton = hexToRgba(surfaceText, 0.08);
  const softSurface = hexToRgba(themePrimary, 0.06);
  const shadowColor = hexToRgba(themePrimary, 0.12);
  const tintedBackground = `radial-gradient(circle at top, ${hexToRgba(themeSecondary, 0.22)}, transparent 35%), ${themeBackground}`;

  return (
    <div className="min-h-screen" style={{ background: tintedBackground }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{ backgroundColor: headerBackground, borderColor: surfaceBorder }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-52" style={{ backgroundColor: neutralSkeleton }} />
              <Skeleton className="h-4 w-36 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl" style={{ backgroundColor: secondarySkeleton }} />
              <Skeleton className="h-10 w-28 rounded-xl" style={{ backgroundColor: neutralSkeleton }} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.9fr]">
          <section
            className="overflow-hidden rounded-[2rem] border"
            style={{
              borderColor: surfaceBorder,
              backgroundColor: hexToRgba(themeSurface, 0.92),
              boxShadow: `0 24px 80px ${shadowColor}`,
            }}
          >
            <div
              className="h-64 p-6 sm:h-72 sm:p-8"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(themePrimary, 0.18)} 0%, ${hexToRgba(themeSecondary, 0.14)} 48%, ${hexToRgba(themeSurface, 0.96)} 100%)`,
              }}
            >
              <Skeleton className="h-10 w-3/4 max-w-xl" style={{ backgroundColor: hexToRgba(themeSurface, 0.72) }} />
              <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-full" style={{ backgroundColor: hexToRgba(themeSurface, 0.6) }} />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-full" style={{ backgroundColor: hexToRgba(themeSurface, 0.52) }} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Skeleton className="h-11 w-40 rounded-full" style={{ backgroundColor: hexToRgba(themeSurface, 0.58) }} />
                <Skeleton className="h-11 w-36 rounded-full" style={{ backgroundColor: hexToRgba(themeSurface, 0.5) }} />
                <Skeleton className="h-11 w-28 rounded-full" style={{ backgroundColor: hexToRgba(themeSurface, 0.45) }} />
              </div>
            </div>
            <div className="grid gap-4 border-t p-6 sm:grid-cols-3" style={{ borderColor: surfaceBorder }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl p-4" style={{ backgroundColor: softSurface }}>
                  <Skeleton className="h-4 w-20 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
                  <Skeleton className="mt-3 h-6 w-28" style={{ backgroundColor: primarySkeleton }} />
                </div>
              ))}
            </div>
          </section>

          <aside
            className="rounded-[2rem] border p-6"
            style={{
              borderColor: surfaceBorder,
              backgroundColor: hexToRgba(themeSurface, 0.92),
              boxShadow: `0 20px 60px ${shadowColor}`,
            }}
          >
            <Skeleton className="h-8 w-40" style={{ backgroundColor: primarySkeleton }} />
            <Skeleton className="mt-3 h-4 w-full rounded-full" style={{ backgroundColor: neutralSkeleton }} />
            <Skeleton className="mt-2 h-4 w-3/4 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border p-4" style={{ borderColor: surfaceBorder }}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl" style={{ backgroundColor: primarySkeleton }} />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
                      <Skeleton className="h-3 w-20 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-xl" style={{ backgroundColor: secondarySkeleton }} />
          </aside>
        </div>

        <section
          className="mt-8 rounded-[2rem] border p-6"
          style={{
            borderColor: surfaceBorder,
            backgroundColor: hexToRgba(themeSurface, 0.92),
            boxShadow: `0 20px 60px ${shadowColor}`,
          }}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" style={{ backgroundColor: primarySkeleton }} />
              <Skeleton className="h-4 w-52 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" style={{ backgroundColor: neutralSkeleton }} />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: surfaceBorder, backgroundColor: softSurface }}>
                <Skeleton
                  className="aspect-[4/5] rounded-none"
                  style={{ backgroundColor: index % 3 === 0 ? primarySkeleton : index % 3 === 1 ? secondarySkeleton : neutralSkeleton }}
                />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
                  <Skeleton className="h-3 w-24 rounded-full" style={{ backgroundColor: neutralSkeleton }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
