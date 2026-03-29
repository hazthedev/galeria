// ============================================
// Galeria - Super Admin Profile
// ============================================

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, User, Lock, Save } from 'lucide-react';
import { MFASettings } from '@/components/admin/MFASettings';

export default function SuperAdminProfilePage() {
    const { user, refresh } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!name && !password) {
            toast.info('No changes to save');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name !== user?.name ? name : undefined,
                    password: password || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to update profile');

            toast.success('Profile updated successfully');

            // Clear password fields
            setPassword('');
            setConfirmPassword('');

            // Refresh user context
            await refresh();

        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account details and security
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-violet-500" />
                            Basic Information
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50"
                            />
                            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                placeholder="Your name"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-violet-500" />
                            Security
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                placeholder="Leave blank to keep current password"
                                minLength={8}
                            />
                        </div>

                        {password && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 sm:ml-auto sm:w-auto"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Multi-Factor Authentication
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Manage the extra verification step for your super admin account.
                    </p>
                </div>
                <div className="p-4 sm:p-6">
                    <MFASettings />
                </div>
            </div>
        </div>
    );
}
