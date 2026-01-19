// ============================================
// MOMENTIQUE - Supervisor Tenants Management
// ============================================

'use client';

import { Building2 } from 'lucide-react';

export default function SupervisorTenantsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tenant Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage all tenants and their configurations
                </p>
            </div>

            {/* Placeholder */}
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Building2 className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Tenant Management
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    Coming soon...
                </p>
            </div>
        </div>
    );
}
