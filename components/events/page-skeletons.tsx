import { Skeleton } from '@/components/ui/skeleton';

export function OrganizerEventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 sm:h-80">
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl text-center">
            <Skeleton className="mx-auto h-12 w-3/4 max-w-xl rounded-full bg-white/35" />
            <Skeleton className="mx-auto mt-4 h-5 w-40 rounded-full bg-white/25" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-5 w-32 rounded-full" />

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-full max-w-2xl rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-56 rounded-full" />
                <Skeleton className="h-4 w-48 rounded-full" />
                <Skeleton className="h-4 w-40 rounded-full" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrganizerEventAdminSkeleton() {
  const tabs = [
    'Overview',
    'Lucky Draw',
    'Attendance',
    'Photo Challenge',
    'QR Code',
    'Settings',
    'Moderation',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="mb-4 inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
            Back to Event
          </span>
          <div className="space-y-3">
            <Skeleton className="h-10 w-80 max-w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Admin Dashboard</p>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-8 overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                disabled
                className={
                  index === 0
                    ? 'flex items-center whitespace-nowrap border-b-2 border-violet-500 px-1 py-4 text-sm font-medium text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'flex items-center whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 dark:text-gray-400'
                }
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-3 h-8 w-52" />
          <Skeleton className="mb-8 h-4 w-full max-w-2xl rounded-full" />

          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="mt-4 h-8 w-20" />
                <Skeleton className="mt-3 h-4 w-28 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <div className="rounded-2xl border border-gray-100 p-5 dark:border-gray-700">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-6 h-56 w-full rounded-3xl" />
            </div>
            <div className="rounded-2xl border border-gray-100 p-5 dark:border-gray-700">
              <Skeleton className="h-5 w-32 rounded-full" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-3 w-20 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
