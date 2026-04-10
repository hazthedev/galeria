'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Ban,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminTenantListItem } from '@/lib/domain/admin/types';
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminInputWithIconClassName,
  adminSelectClassName,
} from '@/components/admin/control-plane';

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

const statusTones: Record<string, 'mint' | 'signal' | 'default'> = {
  active: 'mint',
  suspended: 'signal',
  trialing: 'default',
};

const tierTones: Record<string, 'mint' | 'signal' | 'default'> = {
  free: 'default',
  pro: 'signal',
  premium: 'mint',
  enterprise: 'mint',
  tester: 'signal',
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
    } catch (fetchError) {
      console.error('Failed to fetch tenants:', fetchError);
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
        const payload = await response.json();
        toast.error(payload.error || 'Failed to update tenant');
      }
    } catch (actionError) {
      console.error('Failed to update tenant:', actionError);
      toast.error('Failed to update tenant');
    }
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
        const payload = await response.json();
        toast.error(payload.error || 'Failed to delete tenant');
      }
    } catch (deleteError) {
      console.error('Failed to delete tenant:', deleteError);
      toast.error('Failed to delete tenant');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Account stewardship"
        title="Tenant Management"
        description="Move through subscription state, tenant health, and ownership actions with a cleaner sense of what each account represents and what will happen next."
        actions={
          <AdminActionButton href="/admin">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </AdminActionButton>
        }
      />

      <AdminPanel
        title="Tenant filters"
        description="Search by company, slug, plan, or account state."
        className="admin-reveal admin-reveal-delay-1"
      >
        <div className="flex flex-col gap-3 xl:flex-row">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setCurrentPage(1);
              setAppliedSearch(searchQuery.trim());
            }}
            className="flex-1"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
              <input
                type="text"
                placeholder="Search by name or slug..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className={adminInputWithIconClassName}
              />
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={adminSelectClassName}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Trial</option>
          </select>

          <select
            value={tierFilter}
            onChange={(event) => {
              setTierFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={adminSelectClassName}
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
            <option value="tester">Tester</option>
          </select>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Tenant ledger"
        description="A clear view of which accounts are stable, which ones need intervention, and where volume is building."
        className="admin-reveal admin-reveal-delay-2"
      >
        {isLoading ? (
          <AdminLoadingState label="Loading tenants" />
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-[rgba(255,108,122,0.24)] bg-[rgba(255,108,122,0.08)] px-6 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-[#ff9ba4]" />
            <p className="max-w-lg text-sm leading-6 text-[#ffd1d6]">{error}</p>
            <AdminActionButton onClick={() => void fetchTenants()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </AdminActionButton>
          </div>
        ) : tenants.length === 0 ? (
          <AdminEmptyState
            icon={Building2}
            title="No tenants found"
            description="Try removing filters or broadening the search query."
          />
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="w-full">
                <thead className="admin-table-head">
                  <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
                    <th className="px-5 py-4">Tenant</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Events</th>
                    <th className="px-5 py-4">Users</th>
                    <th className="px-5 py-4">Photos</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="admin-table-row">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-lg font-semibold text-[var(--admin-text)]">{tenant.company_name}</p>
                          <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{tenant.slug || tenant.id}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                          data-tone={tierTones[tenant.subscription_tier] || 'default'}
                        >
                          {tierLabels[tenant.subscription_tier] || tenant.subscription_tier}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                          data-tone={statusTones[tenant.status] || 'default'}
                        >
                          {statusLabels[tenant.status] || tenant.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">{tenant.event_count}</td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">{tenant.user_count}</td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">{tenant.photo_count}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/tenants/${tenant.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
                          >
                            Edit
                            <Edit className="h-3.5 w-3.5" />
                          </Link>

                          {tenant.status === 'active' ? (
                            <button
                              onClick={() => void handleStatusChange(tenant.id, 'suspended')}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[#f8c27c] transition hover:text-[#ffd9a5]"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleStatusChange(tenant.id, 'active')}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[#9ce7dd] transition hover:text-[#c8f6ef]"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedTenant(tenant)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#ff9ba4] transition hover:text-[#ffd1d6]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 xl:hidden">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--admin-text)]">{tenant.company_name}</p>
                      <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{tenant.slug || tenant.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTenant(tenant)}
                      className="rounded-full border border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] p-2 text-[#ff9ba4]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      data-tone={tierTones[tenant.subscription_tier] || 'default'}
                    >
                      {tierLabels[tenant.subscription_tier] || tenant.subscription_tier}
                    </span>
                    <span
                      className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      data-tone={statusTones[tenant.status] || 'default'}
                    >
                      {statusLabels[tenant.status] || tenant.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Events</p>
                      <p className="mt-2 text-[var(--admin-text)]">{tenant.event_count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Users</p>
                      <p className="mt-2 text-[var(--admin-text)]">{tenant.user_count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Photos</p>
                      <p className="mt-2 text-[var(--admin-text)]">{tenant.photo_count}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <AdminActionButton href={`/admin/tenants/${tenant.id}`} variant="primary">
                      Edit tenant
                    </AdminActionButton>
                    {tenant.status === 'active' ? (
                      <AdminActionButton onClick={() => void handleStatusChange(tenant.id, 'suspended')}>
                        Suspend
                      </AdminActionButton>
                    ) : (
                      <AdminActionButton onClick={() => void handleStatusChange(tenant.id, 'active')}>
                        Activate
                      </AdminActionButton>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <AdminActionButton
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </AdminActionButton>
                <p className="text-sm text-[var(--admin-text-soft)]">
                  Page {currentPage} of {totalPages}
                </p>
                <AdminActionButton
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </AdminActionButton>
              </div>
            ) : null}
          </>
        )}
      </AdminPanel>

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
    </AdminPage>
  );
}
