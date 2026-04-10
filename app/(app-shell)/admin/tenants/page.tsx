// ============================================
// Galeria - Tenant Management Page
// ============================================
// Super admin interface for managing all platform tenants

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Edit,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminTenantListItem } from '@/lib/domain/admin/types';

const tierLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
  tester: 'Tester',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  trialing: 'Trial',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  tester: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<AdminTenantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<AdminTenantListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void fetchTenants();
  }, [appliedSearch, currentPage, statusFilter, tierFilter]);

  const fetchTenants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (tierFilter !== 'all') {
        params.append('tier', tierFilter);
      }
      if (appliedSearch) {
        params.append('search', appliedSearch);
      }

      const response = await fetch(`/api/admin/tenants?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError('Failed to load tenants. The server returned an error.');
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setError('Failed to load tenants. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/actions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newStatus === 'suspended' ? 'suspend_tenant' : 'activate_tenant',
          reason:
            newStatus === 'suspended'
              ? 'Suspended from tenant management list'
              : 'Activated from tenant management list',
        }),
      });

      if (response.ok) {
        toast.success(`Tenant ${newStatus === 'suspended' ? 'suspended' : 'activated'}`);
        await fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update tenant');
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
      toast.error('Failed to update tenant');
    }
  };

  const handleDeleteTenant = (tenant: AdminTenantListItem) => {
    setSelectedTenant(tenant);
  };

  const confirmDelete = async () => {
    if (!selectedTenant) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(`Deleted tenant: ${selectedTenant.company_name}`);
        setSelectedTenant(null);
        await fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete tenant');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      toast.error('Failed to delete tenant');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Tenant Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all platform tenants
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentPage(1);
            setAppliedSearch(searchQuery.trim());
          }}
          className="flex-1"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trialing">Trial</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
          <option value="tester">Tester</option>
        </select>
      </div>

      {/* Tenants List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchTenants}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Building2 className="mb-2 h-12 w-12 opacity-50" />
            <p>No tenants found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:block border-b border-gray-200 bg-gray-50 dark:border-gray-700">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Events</th>
                    <th className="px-4 py-3">Users</th>
                    <th className="px-4 py-3">Photos</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Desktop Table */}
            <div className="-mx-4 hidden sm:block overflow-x-auto px-4">
              <table className="w-full">
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tenant.company_name}
                          </p>
                          <p className="text-sm text-gray-500">{tenant.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tierColors[tenant.subscription_tier]}`}>
                          {tierLabels[tenant.subscription_tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[tenant.status]}`}>
                          {statusLabels[tenant.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {tenant.event_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {tenant.user_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {tenant.photo_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/tenants/${tenant.id}`}
                            className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                            title="View details"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {tenant.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(tenant.id, 'suspended')}
                              className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                              title="Suspend tenant"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(tenant.id, 'active')}
                              className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                              title="Activate tenant"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteTenant(tenant)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete tenant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3 p-4">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tenant.company_name}
                      </p>
                      <p className="text-sm text-gray-500">{tenant.slug}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTenant(tenant)}
                      className="text-red-600 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Plan</span>
                      <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[tenant.subscription_tier]}`}>
                        {tierLabels[tenant.subscription_tier]}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tenant.status]}`}>
                        {statusLabels[tenant.status]}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Events</span>
                      <p className="mt-1">{tenant.event_count}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Users</span>
                      <p className="mt-1">{tenant.user_count}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Photos</span>
                      <p className="mt-1">{tenant.photo_count}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {tenant.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(tenant.id, 'suspended')}
                        className="flex-1 flex items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Ban className="h-3 w-3" />
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(tenant.id, 'active')}
                        className="flex-1 flex items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Activate
                      </button>
                    )}
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="flex-1 flex items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

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
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!selectedTenant}
        onOpenChange={(open) => {
          if (!open) setSelectedTenant(null);
        }}
        title="Delete Tenant"
        description={
          <>
            Are you sure you want to delete <strong>{selectedTenant?.company_name}</strong>?
            <br />
            <span className="text-xs text-gray-500">
              This will permanently delete the tenant, all its users, events, and photos.
            </span>
          </>
        }
        confirmLabel="Delete Tenant"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="danger"
        isPending={isDeleting}
      />
    </div>
  );
}
