'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminSettings] Error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unable to load settings</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        The settings screen hit an unexpected error. Please try this page again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
      >
        Retry
      </button>
    </div>
  );
}
