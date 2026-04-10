'use client';

import { useState } from 'react';
import { ArrowLeftRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth';

export function SupportModeBanner() {
  const { session, refresh } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const impersonation = session?.impersonation;
  if (!impersonation?.readOnly) {
    return null;
  }

  const handleExit = async () => {
    setIsPending(true);

    try {
      const response = await fetch('/api/admin/impersonation', {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to exit support mode');
      }

      toast.success('Support mode ended');
      await refresh();
      window.location.assign(payload.data?.redirectTo || '/admin');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to exit support mode');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/40">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Support Mode</p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You are viewing the app as {session?.name || session?.email}. Writes are blocked.
              Acting admin: {impersonation.actorName || impersonation.actorEmail}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleExit()}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/40"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {isPending ? 'Restoring admin session...' : 'Exit Support Mode'}
        </button>
      </div>
    </div>
  );
}
