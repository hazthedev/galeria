// ============================================
// MOMENTIQUE - Supervisor Settings
// ============================================

'use client';

import { Settings } from 'lucide-react';

export default function SupervisorSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    System Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Configure system-wide settings and defaults
                </p>
            </div>

            {/* Placeholder */}
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Settings className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                    System Settings
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    Coming soon...
                </p>
            </div>
        </div>
    );
}
