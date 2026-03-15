import { Skeleton } from '@/components/ui/skeleton';
import { EventStatsSkeleton } from '@/components/events/event-stats';
import {
  Settings,
  QrCode,
  Users,
  Image as ImageIcon,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';

export function OrganizerDashboardSkeleton() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 pt-16 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full rounded-full" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg animate-none" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-full animate-none" />
                  <Skeleton className="h-8 w-16 rounded-full animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-7 w-32 rounded-full animate-none" />
            <Skeleton className="h-11 w-full rounded-xl animate-none sm:w-40" />
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-11 w-full flex-1 rounded-xl animate-none" />
            <Skeleton className="h-11 w-full rounded-xl animate-none sm:w-32" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="mb-2 h-4 w-20 rounded-full animate-none" />
            <Skeleton className="h-11 w-full rounded-xl animate-none sm:w-56" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="relative h-32 bg-gradient-to-br from-violet-500 to-pink-500">
                <div className="absolute left-3 top-3">
                  <Skeleton className="h-6 w-14 rounded-full bg-white/25 animate-none" />
                </div>
                <div className="absolute right-3 top-3">
                  <Skeleton className="h-6 w-16 rounded-full bg-white/25 animate-none" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-12 w-12 rounded-full bg-white/20 animate-none" />
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-6 w-32 max-w-full rounded-full animate-none" />
                    <Skeleton className="h-4 w-full rounded-full animate-none" />
                    <Skeleton className="h-4 w-2/3 rounded-full animate-none" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg animate-none" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 max-w-full rounded-full animate-none" />
                  <Skeleton className="h-4 w-28 max-w-full rounded-full animate-none" />
                  <Skeleton className="h-4 w-20 rounded-full animate-none" />
                </div>
                <div className="flex items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <Skeleton className="h-4 w-20 rounded-full animate-none" />
                  <Skeleton className="h-4 w-20 rounded-full animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Skeleton className="h-10 w-full rounded-xl animate-none sm:w-24" />
          <Skeleton className="h-4 w-28 rounded-full animate-none" />
          <Skeleton className="h-10 w-full rounded-xl animate-none sm:w-24" />
        </div>
      </div>
    </div>
  );
}

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
    { label: 'Overview', icon: ImageIcon },
    { label: 'Lucky Draw', icon: Sparkles },
    { label: 'Attendance', icon: Users },
    { label: 'Photo Challenge', icon: Target },
    { label: 'QR Code', icon: QrCode },
    { label: 'Settings', icon: Settings },
    { label: 'Moderation', icon: Shield },
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
            {tabs.map((tab, index) => {
              const Icon = tab.icon;

              return (
              <button
                key={tab.label}
                type="button"
                disabled
                className={
                  index === 0
                    ? 'flex items-center gap-2 whitespace-nowrap border-b-2 border-violet-500 px-1 py-4 text-sm font-medium text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 dark:text-gray-400'
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Event Overview
          </h2>
          <EventStatsSkeleton allowAdvancedAnalytics allowReactions />
        </div>
      </div>
    </div>
  );
}
