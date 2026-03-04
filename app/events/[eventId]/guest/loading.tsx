import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading event...</p>
    </div>
  );
}
