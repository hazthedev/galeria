// ============================================
// Galeria - Privacy Placeholder Page
// ============================================

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Our Privacy Policy is being finalized. For questions, contact us at{' '}
          <a
            href="mailto:galeria.support@gmail.com"
            className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            galeria.support@gmail.com
          </a>
          .
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
