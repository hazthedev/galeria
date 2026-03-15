import { Skeleton } from '@/components/ui/skeleton';

type ModerationPhotoStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function LuckyDrawAdminSkeleton() {
  const subTabs = ['Configuration', 'Entries', 'Participants', 'Execute Draw', 'History'];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {subTabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              disabled
              className={
                index === 0
                  ? 'flex items-center whitespace-nowrap border-b-2 border-violet-500 px-1 py-3 text-sm font-medium text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'flex items-center whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 dark:text-gray-400'
              }
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-44 animate-none rounded-full" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full animate-none rounded-full" />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-28 animate-none rounded-full" />
            <Skeleton className="h-9 w-24 animate-none rounded-xl" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <Skeleton className="h-10 w-full animate-none rounded-xl" />
                  <Skeleton className="h-10 w-full animate-none rounded-xl md:col-span-2" />
                  <Skeleton className="h-10 w-full animate-none rounded-xl" />
                  <Skeleton className="h-10 w-full animate-none rounded-xl md:col-span-3" />
                  <Skeleton className="h-10 w-24 animate-none rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <Skeleton className="h-5 w-32 animate-none rounded-full" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-full animate-none rounded-xl" />
                <Skeleton className="h-10 w-3/4 animate-none rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-40 animate-none rounded-xl" />
          <Skeleton className="h-10 w-28 animate-none rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function LuckyDrawEntriesPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton className="h-12 w-12 animate-none rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 animate-none rounded-full" />
            <Skeleton className="h-3 w-52 max-w-full animate-none rounded-full" />
          </div>
          <Skeleton className="h-6 w-16 animate-none rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function LuckyDrawParticipantsPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-36 animate-none rounded-full" />
            <Skeleton className="h-3 w-56 max-w-full animate-none rounded-full" />
            <Skeleton className="h-3 w-44 animate-none rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 animate-none rounded-full" />
              <Skeleton className="h-3 w-16 animate-none rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 animate-none rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LuckyDrawHistoryPanelSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-28 animate-none rounded-full" />
            <Skeleton className="h-6 w-20 animate-none rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-4 w-24 animate-none rounded-full" />
            <Skeleton className="h-4 w-20 animate-none rounded-full" />
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 animate-none rounded-full" />
              <Skeleton className="h-6 w-24 animate-none rounded-full" />
              <Skeleton className="h-6 w-16 animate-none rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttendanceOverviewSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton className="h-4 w-28 animate-none rounded-full" />
          <Skeleton className="mt-4 h-9 w-20 animate-none rounded-full" />
          <Skeleton className="mt-3 h-3 w-24 animate-none rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AttendanceGuestListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full animate-none rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-16 animate-none rounded-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="grid grid-cols-6 gap-4 px-4 py-4">
              {Array.from({ length: 6 }).map((_, col) => (
                <Skeleton
                  key={col}
                  className={
                    col === 0
                      ? 'h-4 w-24 animate-none rounded-full'
                      : 'h-4 w-16 animate-none rounded-full'
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PhotoChallengeAdminSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 dark:border-gray-700 dark:from-violet-950/20 dark:to-purple-950/20 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Skeleton className="h-12 w-12 animate-none rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-6 w-36 animate-none rounded-full" />
              <Skeleton className="h-4 w-52 max-w-full animate-none rounded-full" />
              <Skeleton className="h-3 w-40 animate-none rounded-full" />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Skeleton className="h-11 w-full animate-none rounded-xl sm:w-20" />
            <Skeleton className="h-11 w-full animate-none rounded-xl sm:w-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 animate-none rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-14 animate-none rounded-full" />
                <Skeleton className="h-3 w-24 animate-none rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
          <Skeleton className="h-6 w-36 animate-none rounded-full" />
          <Skeleton className="mt-2 h-4 w-56 animate-none rounded-full" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-10 w-10 animate-none rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28 animate-none rounded-full" />
                    <Skeleton className="h-3 w-24 animate-none rounded-full" />
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                  <Skeleton className="h-2 w-full animate-none rounded-full md:w-32" />
                  <Skeleton className="h-6 w-16 animate-none rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModerationActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 animate-none rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 animate-none rounded-full" />
              <Skeleton className="h-3 w-32 animate-none rounded-full" />
            </div>
          </div>
          <Skeleton className="h-3 w-28 animate-none rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function OrganizerPhotoModerationSkeleton({
  activeStatus = 'all',
}: {
  activeStatus?: ModerationPhotoStatus;
}) {
  const statusTabs: Array<{ id: ModerationPhotoStatus; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
            Back to Admin
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Photo Moderation
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review and manage photo submissions
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
              <Skeleton className="h-4 w-4 animate-none rounded-full bg-green-200 dark:bg-green-800" />
              <Skeleton className="h-4 w-28 animate-none rounded-full bg-green-200 dark:bg-green-800" />
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-8 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled
                className={
                  activeStatus === tab.id
                    ? 'flex items-center gap-2 whitespace-nowrap border-b-2 border-violet-500 px-1 py-4 text-sm font-medium text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 dark:text-gray-400'
                }
              >
                {tab.label}
                {tab.id !== 'all' && (
                  <Skeleton className="h-5 w-8 animate-none rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-24 animate-none rounded-xl" />
            <Skeleton className="h-9 w-28 animate-none rounded-xl" />
            <Skeleton className="h-9 w-40 animate-none rounded-xl" />
            <Skeleton className="h-9 w-36 animate-none rounded-xl" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
              >
                <Skeleton className="aspect-square rounded-none animate-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-32 animate-none rounded-full" />
                  <Skeleton className="h-3 w-24 animate-none rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
