// ============================================
// Galeria - Auth Page Shell
// ============================================

'use client';

import type { ReactNode } from 'react';
import { ThemeToggleButton } from '@/components/shared/ThemeToggleButton';

interface AuthPageShellProps {
  children: ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f6f1ea] dark:bg-gray-900">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-br from-violet-200/30 via-purple-100/20 to-transparent blur-3xl dark:from-violet-900/25 dark:via-purple-900/15" />
        <div className="absolute right-0 top-16 h-[260px] w-[260px] rounded-full bg-gradient-to-bl from-purple-100/25 to-transparent blur-3xl dark:from-purple-900/15" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.012)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)]" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggleButton className="border-[#dfd2c3]/80 bg-[#fcf8f2]/90 text-stone-600 shadow-sm hover:border-[#d4c4b3] hover:text-slate-900 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:text-white" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
