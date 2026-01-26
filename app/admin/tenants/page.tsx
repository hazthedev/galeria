// ============================================
// MOMENTIQUE - Supervisor Tenants Management
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, RefreshCcw, Pencil, Ban, CheckCircle, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import type { ITenant, ITenantFeatures, ITenantLimits, SubscriptionTier, TenantType } from '@/lib/types';

type TenantStatus = 'active' | 'suspended' | 'trial';

const defaultFeatures: ITenantFeatures = {
    lucky_draw: false,
    photo_reactions: true,
    video_uploads: false,
    custom_templates: false,
    api_access: false,
    sso: false,
    white_label: false,
    advanced_analytics: false,
};

const defaultLimits: ITenantLimits = {
    max_events_per_month: 1,
    max_storage_gb: 1,
    max_admins: 1,
    max_photos_per_event: 20,
    max_draw_entries_per_event: 0,
    custom_features: [],
};

export default function SupervisorTenantsPage() {
    const [tenants, setTenants] = useState<ITenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeTenant, setActiveTenant] = useState<ITenant | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [createForm, setCreateForm] = useState({
        tenant_type: 'white_label' as TenantType,
        brand_name: '',
        company_name: '',
        contact_email: '',
        domain: '',
        subdomain: '',
        subscription_tier: 'free' as SubscriptionTier,
    });

    const [editForm, setEditForm] = useState<{
        tenant_type: TenantType;
        brand_name: string;
        company_name: string;
        contact_email: string;
        domain: string;
        subdomain: string;
        subscription_tier: SubscriptionTier;
        status: TenantStatus;
        features_enabled: ITenantFeatures;
        limits: ITenantLimits;
    } | null>(null);

    const fetchTenants = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });
            if (search.trim()) params.set('search', search.trim());
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const response = await fetch(`/api/admin/tenants?${params.toString()}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load tenants');
            }

            setTenants(data.data || []);
            setTotalPages(data.pagination?.total_pages || 1);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load tenants');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, [page, statusFilter]);

    const openEdit = (tenant: ITenant) => {
        setActiveTenant(tenant);
        setEditForm({
            tenant_type: tenant.tenant_type,
            brand_name: tenant.brand_name,
            company_name: tenant.company_name,
            contact_email: tenant.contact_email,
            domain: tenant.domain || '',
            subdomain: tenant.subdomain || '',
            subscription_tier: tenant.subscription_tier,
            status: tenant.status,
            features_enabled: {
                ...defaultFeatures,
                ...(tenant.features_enabled || {}),
            },
            limits: {
                ...defaultLimits,
                ...(tenant.limits || {}),
                custom_features: tenant.limits?.custom_features || [],
            },
        });
        setIsEditOpen(true);
    };

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(createForm),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create tenant');
            }

            toast.success('Tenant created');
            setIsCreateOpen(false);
            setCreateForm({
                tenant_type: 'white_label' as TenantType,
                brand_name: '',
                company_name: '',
                contact_email: '',
                domain: '',
                subdomain: '',
                subscription_tier: 'free',
            });
            fetchTenants();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create tenant');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!activeTenant || !editForm) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/tenants/${activeTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editForm),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update tenant');
            }

            toast.success('Tenant updated');
            setIsEditOpen(false);
            setActiveTenant(null);
            setEditForm(null);
            fetchTenants();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update tenant');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (tenant: ITenant) => {
        const nextStatus: TenantStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
        try {
            const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update tenant');
            }

            toast.success(`Tenant ${nextStatus === 'active' ? 'activated' : 'suspended'}`);
            fetchTenants();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update tenant');
        }
    };

    const deleteTenant = async (tenant: ITenant) => {
        if (!window.confirm(`Delete tenant "${tenant.brand_name}"? This cannot be undone.`)) {
            return;
        }
        try {
            const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete tenant');
            }
            toast.success('Tenant deleted');
            fetchTenants();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete tenant');
        }
    };

    const statusBadge = (status: TenantStatus) => {
        return clsx(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
            status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : status === 'suspended'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tenant Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage all tenants and their configurations
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchTenants()}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                    >
                        <Plus className="h-4 w-4" />
                        New Tenant
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        fetchTenants();
                    }}
                    className="flex-1"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tenants..."
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </form>
                <div className="flex items-center gap-2">
                    {(['all', 'active', 'trial', 'suspended'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setStatusFilter(status as TenantStatus | 'all');
                                setPage(1);
                            }}
                            className={clsx(
                                'rounded-full px-3 py-1 text-xs font-medium capitalize',
                                statusFilter === status
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Tier</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Domain</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                        No tenants found
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {tenant.brand_name}
                                            </div>
                                            <div className="text-xs text-gray-500">{tenant.contact_email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {tenant.tenant_type}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {tenant.subscription_tier}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={statusBadge(tenant.status)}>{tenant.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {tenant.domain || tenant.subdomain || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(tenant)}
                                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(tenant)}
                                                    className={clsx(
                                                        'rounded-lg px-2 py-1 text-xs',
                                                        tenant.status === 'suspended'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    )}
                                                >
                                                    {tenant.status === 'suspended' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteTenant(tenant)}
                                                    className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Tenant</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-500">X</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <select
                                value={createForm.tenant_type}
                                onChange={(e) => setCreateForm({ ...createForm, tenant_type: e.target.value as TenantType })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            >
                                <option value="white_label">White label</option>
                                <option value="demo">Demo</option>
                                <option value="master">Master</option>
                            </select>
                            <input
                                placeholder="Brand name"
                                value={createForm.brand_name}
                                onChange={(e) => setCreateForm({ ...createForm, brand_name: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Company name"
                                value={createForm.company_name}
                                onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Contact email"
                                value={createForm.contact_email}
                                onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Domain (optional)"
                                value={createForm.domain}
                                onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Subdomain (optional)"
                                value={createForm.subdomain}
                                onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <select
                                value={createForm.subscription_tier}
                                onChange={(e) => setCreateForm({ ...createForm, subscription_tier: e.target.value as SubscriptionTier })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isSaving}
                                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
                            >
                                {isSaving ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Tenant</h2>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-500">X</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <select
                                value={editForm.tenant_type}
                                onChange={(e) => setEditForm({ ...editForm, tenant_type: e.target.value as TenantType })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            >
                                <option value="white_label">White label</option>
                                <option value="demo">Demo</option>
                                <option value="master">Master</option>
                            </select>
                            <input
                                placeholder="Brand name"
                                value={editForm.brand_name}
                                onChange={(e) => setEditForm({ ...editForm, brand_name: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Company name"
                                value={editForm.company_name}
                                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Contact email"
                                value={editForm.contact_email}
                                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Domain"
                                value={editForm.domain}
                                onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <input
                                placeholder="Subdomain"
                                value={editForm.subdomain}
                                onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <select
                                value={editForm.subscription_tier}
                                onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value as SubscriptionTier })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TenantStatus })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                            >
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {Object.entries(editForm.features_enabled).map(([key, value]) => (
                                <label key={key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                features_enabled: {
                                                    ...editForm.features_enabled,
                                                    [key]: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                    {key.replace(/_/g, ' ')}
                                </label>
                            ))}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {Object.entries(editForm.limits)
                                .filter(([key]) => key !== 'custom_features')
                                .map(([key, value]) => (
                                    <label key={key} className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <span>{key.replace(/_/g, ' ')}</span>
                                        <input
                                            type="number"
                                            value={value as number}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    limits: {
                                                        ...editForm.limits,
                                                        [key]: parseInt(e.target.value || '0', 10),
                                                    },
                                                })
                                            }
                                        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                                    />
                                </label>
                            ))}
                            <label className="sm:col-span-2 flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <span>custom features (comma separated)</span>
                                <input
                                    type="text"
                                    value={(editForm.limits.custom_features || []).join(', ')}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            limits: {
                                                ...editForm.limits,
                                                custom_features: e.target.value
                                                    .split(',')
                                                    .map((value) => value.trim())
                                                    .filter((value) => value.length > 0),
                                            },
                                        })
                                    }
                                    className="rounded border border-gray-300 px-3 py-2 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
