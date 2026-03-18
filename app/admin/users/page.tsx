// ============================================
// Galeria - Supervisor Users Management
// ============================================

'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Users as UsersIcon,
    Loader2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ConfirmDialog, useConfirmDialog } from '@/components/admin/ConfirmDialog';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'guest' | 'organizer' | 'super_admin';
    subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
    user_subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
    tenant_subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
    tenant_id: string;
    created_at: string;
    last_login_at?: string;
}

export default function SupervisorUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);
    const confirm = useConfirmDialog();

    useEffect(() => {
        fetchUsers();
    }, [currentPage, roleFilter]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
            });
            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await fetch(`/api/admin/users?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                toast.success('User role updated');
                fetchUsers();
            } else {
                toast.error('Failed to update user role');
            }
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const handleTierChange = async (userId: string, userRole: User['role'], newTier: string) => {
        const isSuperAdmin = userRole === 'super_admin';
        const successMessage = isSuperAdmin ? 'Account tier updated' : 'Tenant plan updated';
        const errorMessage = isSuperAdmin ? 'Failed to update account tier' : 'Failed to update tenant plan';

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription_tier: newTier }),
            });

            if (response.ok) {
                toast.success(successMessage);
                fetchUsers();
            } else {
                toast.error(errorMessage);
            }
        } catch (error) {
            toast.error(errorMessage);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('User deleted');
                fetchUsers();
            } else {
                toast.error('Failed to delete user');
            }
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers();
    };

    // Bulk selection handlers
    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const toggleAllUsers = () => {
        if (selectedUserIds.size === users.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(users.map(u => u.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedUserIds.size === 0) return;

        confirm.show({
            title: 'Delete Selected Users',
            description: (
                <>
                  Are you sure you want to delete <strong>{selectedUserIds.size} user(s)</strong>?
                  <br />
                  <span className="text-xs text-gray-500">
                    This action cannot be undone.
                  </span>
                </>
            ),
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
            onConfirm: async () => {
                setIsProcessingBulk(true);
                try {
                    const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'delete',
                            userIds: Array.from(selectedUserIds),
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to delete users');
                    }

                    const data = await response.json();
                    toast.success(`Deleted ${data.processed} user(s)`);
                    setSelectedUserIds(new Set());
                    fetchUsers();
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to delete users');
                } finally {
                    setIsProcessingBulk(false);
                }
            },
        });
    };

    const handleBulkRoleChange = (newRole: string) => {
        if (selectedUserIds.size === 0) return;

        confirm.show({
            title: 'Change Role for Selected Users',
            description: (
                <>
                  Are you sure you want to change the role to <strong>{newRole}</strong> for <strong>{selectedUserIds.size} user(s)</strong>?
                </>
            ),
            confirmLabel: 'Change Role',
            cancelLabel: 'Cancel',
            variant: 'warning',
            onConfirm: async () => {
                setIsProcessingBulk(true);
                try {
                    const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'updateRole',
                            userIds: Array.from(selectedUserIds),
                            role: newRole,
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to update roles');
                    }

                    const data = await response.json();
                    toast.success(`Updated ${data.processed} user(s)`);
                    setSelectedUserIds(new Set());
                    fetchUsers();
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to update roles');
                } finally {
                    setIsProcessingBulk(false);
                }
            },
        });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
            case 'organizer':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        User Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage all users
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </form>
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="guest">Guest</option>
                </select>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUserIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-violet-50 px-4 py-3 dark:bg-violet-900/20">
                    <span className="text-sm font-medium text-violet-900 dark:text-violet-300">
                        {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkRoleChange(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
                            disabled={isProcessingBulk}
                        >
                            <option value="">Change Role...</option>
                            <option value="guest">Make Guest</option>
                            <option value="organizer">Make Organizer</option>
                            <option value="super_admin">Make Super Admin</option>
                        </select>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isProcessingBulk}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                        <button
                            onClick={() => setSelectedUserIds(new Set())}
                            disabled={isProcessingBulk}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <UsersIcon className="mb-2 h-12 w-12 opacity-50" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 p-4 md:hidden">
                            {users.map((user) => {
                                const tierValue = user.role === 'super_admin'
                                    ? (user.user_subscription_tier || user.subscription_tier || 'free')
                                    : (user.tenant_subscription_tier || user.subscription_tier || 'free');

                                return (
                                    <div
                                        key={user.id}
                                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {user.name}
                                                </p>
                                                <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                aria-label={`Delete ${user.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                <span>Role</span>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={clsx(
                                                        'h-11 w-full rounded-lg border border-transparent px-3 text-sm font-medium',
                                                        getRoleBadgeColor(user.role)
                                                    )}
                                                >
                                                    <option value="guest">Guest</option>
                                                    <option value="organizer">Organizer</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </label>

                                            <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                <span>Plan</span>
                                                <select
                                                    value={tierValue}
                                                    onChange={(e) => handleTierChange(user.id, user.role, e.target.value)}
                                                    className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="enterprise">Enterprise</option>
                                                    <option value="tester">Tester</option>
                                                </select>
                                            </label>
                                        </div>

                                        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                                            <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Joined</dt>
                                                <dd className="mt-1">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Last Login</dt>
                                                <dd className="mt-1">
                                                    {user.last_login_at
                                                        ? new Date(user.last_login_at).toLocaleDateString()
                                                        : 'Never'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="-mx-4 hidden overflow-x-auto px-4 md:block md:px-0">
                            <table className="min-w-[860px] w-full">
                                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                    <tr>
                                        <th className="w-12 px-4 py-3">
                                            <button
                                                onClick={toggleAllUsers}
                                                className="flex h-5 w-5 items-center justify-center"
                                                aria-label={selectedUserIds.size === users.length ? 'Deselect all' : 'Select all'}
                                            >
                                                {selectedUserIds.size === users.length && users.length > 0 ? (
                                                    <CheckSquare className="h-5 w-5 text-violet-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Plan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Joined
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Last Login
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className={clsx(
                                            "hover:bg-gray-50 dark:hover:bg-gray-700",
                                            selectedUserIds.has(user.id) && "bg-violet-50 dark:bg-violet-900/10"
                                        )}>
                                            <td className="w-12 px-4 py-3">
                                                <button
                                                    onClick={() => toggleUserSelection(user.id)}
                                                    className="flex h-5 w-5 items-center justify-center"
                                                    aria-label={selectedUserIds.has(user.id) ? 'Deselect user' : 'Select user'}
                                                >
                                                    {selectedUserIds.has(user.id) ? (
                                                        <CheckSquare className="h-5 w-5 text-violet-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={clsx(
                                                        'h-11 rounded-full px-3 text-xs font-medium',
                                                        getRoleBadgeColor(user.role)
                                                    )}
                                                >
                                                    <option value="guest">Guest</option>
                                                    <option value="organizer">Organizer</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {/**
                                                  * Super admins keep account-level tier.
                                                  * Organizer/guest rows reflect shared tenant plan.
                                                  */}
                                                {(() => {
                                                    const tierValue = user.role === 'super_admin'
                                                        ? (user.user_subscription_tier || user.subscription_tier || 'free')
                                                        : (user.tenant_subscription_tier || user.subscription_tier || 'free');
                                                    return (
                                                <select
                                                    value={tierValue}
                                                    onChange={(e) => handleTierChange(user.id, user.role, e.target.value)}
                                                    className="h-11 rounded-full bg-gray-100 px-3 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="enterprise">Enterprise</option>
                                                    <option value="tester">Tester</option>
                                                </select>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {user.last_login_at
                                                    ? new Date(user.last_login_at).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Delete user"
                                                    aria-label={`Delete ${user.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog {...confirm.dialog} />
        </div>
    );
}
