'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ChevronLeft, ChevronRight, ExternalLink, Search, Square, Trash2, Users as UsersIcon, X } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ConfirmDialog, useConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AdminActionButton, AdminEmptyState, AdminLoadingState, AdminPage, AdminPageHeader, AdminPanel, adminInputWithIconClassName, adminSelectClassName } from '@/components/admin/control-plane';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'organizer' | 'super_admin';
  subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
  user_subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
  tenant_subscription_tier?: 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
  last_login_at?: string;
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAvatarTone(role: string) {
  if (role === 'super_admin') return 'border-[rgba(177,140,255,0.26)] bg-[rgba(177,140,255,0.16)] text-[#dfd0ff]';
  if (role === 'organizer') return 'border-[rgba(102,223,212,0.24)] bg-[rgba(102,223,212,0.12)] text-[#a0ebe2]';
  return 'border-white/10 bg-white/[0.05] text-[var(--admin-text-soft)]';
}

function getRoleTone(role: string): 'signal' | 'mint' | 'default' {
  if (role === 'super_admin') return 'signal';
  if (role === 'organizer') return 'mint';
  return 'default';
}

function getTierTone(tier: string): 'signal' | 'mint' | 'default' {
  if (tier === 'enterprise' || tier === 'premium') return 'mint';
  if (tier === 'pro' || tier === 'tester') return 'signal';
  return 'default';
}

function getRoleLabel(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'organizer') return 'Organizer';
  return 'Guest';
}

function getTierValue(user: User) {
  return user.role === 'super_admin'
    ? user.user_subscription_tier || user.subscription_tier || 'free'
    : user.tenant_subscription_tier || user.subscription_tier || 'free';
}

export default function SupervisorUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const confirm = useConfirmDialog();

  useEffect(() => {
    void fetchUsers();
  }, [currentPage, roleFilter, appliedSearch]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (appliedSearch) params.append('search', appliedSearch);
      const response = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.total || data.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const patchUser = async (userId: string, payload: Record<string, string>, successMessage: string, errorMessage: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(errorMessage);
      toast.success(successMessage);
      await fetchUsers();
    } catch {
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    confirm.show({
      title: 'Delete User',
      description: <>Are you sure you want to delete <strong>{userName}</strong>?<br /><span className="text-xs text-gray-500">This action cannot be undone.</span></>,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
          if (!response.ok) throw new Error('Failed');
          toast.success('User deleted');
          await fetchUsers();
        } catch {
          toast.error('Failed to delete user');
        }
      },
    });
  };

  const handleBulkAction = (action: 'delete' | 'updateRole', role?: string) => {
    if (selectedUserIds.size === 0) return;
    const isDelete = action === 'delete';
    confirm.show({
      title: isDelete ? 'Delete Selected Users' : 'Change Role for Selected Users',
      description: isDelete
        ? <>Are you sure you want to delete <strong>{selectedUserIds.size} user(s)</strong>?<br /><span className="text-xs text-gray-500">This action cannot be undone.</span></>
        : <>Are you sure you want to change the role to <strong>{role}</strong> for <strong>{selectedUserIds.size} user(s)</strong>?</>,
      confirmLabel: isDelete ? 'Delete' : 'Change Role',
      cancelLabel: 'Cancel',
      variant: isDelete ? 'danger' : 'warning',
      onConfirm: async () => {
        setIsProcessingBulk(true);
        try {
          const response = await fetch('/api/admin/users', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, userIds: Array.from(selectedUserIds), role }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Bulk action failed');
          }
          const data = await response.json();
          toast.success(`${isDelete ? 'Deleted' : 'Updated'} ${data.processed} user(s)`);
          setSelectedUserIds(new Set());
          await fetchUsers();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Bulk action failed');
        } finally {
          setIsProcessingBulk(false);
        }
      },
    });
  };

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);
  }, [currentPage, totalPages]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Identity operations"
        title="Users"
        description="Manage access, role posture, and account plan context from one workspace that stays readable even when you are editing at speed."
        actions={<AdminActionButton href="/admin"><ChevronLeft className="h-4 w-4" />Back to dashboard</AdminActionButton>}
      />

      <AdminPanel title="User filters" description="Search by name or email, then narrow by role." className="admin-reveal admin-reveal-delay-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
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
              <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className={adminInputWithIconClassName} />
              {searchQuery ? (
                <button type="button" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.04] p-1 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text)]" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </form>

          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setCurrentPage(1); }} className={adminSelectClassName}>
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="organizer">Organizer</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">Total users {isLoading ? '...' : totalUsers}</span>
          {appliedSearch ? <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="signal">Query {appliedSearch}</span> : null}
        </div>
      </AdminPanel>

      {selectedUserIds.size > 0 ? (
        <div className="admin-reveal admin-reveal-delay-2 flex flex-wrap items-center gap-3 rounded-[24px] border border-[rgba(177,140,255,0.22)] bg-[rgba(177,140,255,0.1)] px-4 py-3">
          <span className="text-sm font-semibold text-[#e3d7ff]">{selectedUserIds.size} selected</span>
          <div className="h-4 w-px bg-[rgba(177,140,255,0.3)]" />
          <select
            onChange={(event) => {
              if (event.target.value) {
                handleBulkAction('updateRole', event.target.value);
                event.target.value = '';
              }
            }}
            className="admin-select h-10 rounded-2xl px-3 text-xs font-semibold uppercase tracking-[0.14em]"
            disabled={isProcessingBulk}
          >
            <option value="">Change role</option>
            <option value="guest">Make Guest</option>
            <option value="organizer">Make Organizer</option>
            <option value="super_admin">Make Super Admin</option>
          </select>
          <AdminActionButton onClick={() => handleBulkAction('delete')} disabled={isProcessingBulk} className="border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]">
            <Trash2 className="h-4 w-4" />Delete
          </AdminActionButton>
          <button type="button" onClick={() => setSelectedUserIds(new Set())} disabled={isProcessingBulk} className="text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff] disabled:opacity-50">Clear</button>
        </div>
      ) : null}

      <AdminPanel title="User ledger" description="Select multiple rows for batch changes, adjust roles inline, and move straight into a user detail view." className="admin-reveal admin-reveal-delay-2">
        {isLoading ? (
          <AdminLoadingState label="Loading users" />
        ) : users.length === 0 ? (
          <AdminEmptyState icon={UsersIcon} title="No users found" description="Try removing filters or broadening the search query." />
        ) : (
          <>
            <div className="space-y-3 xl:hidden">
              {users.map((user) => {
                const tierValue = getTierValue(user);
                const isSelected = selectedUserIds.has(user.id);
                return (
                  <div key={user.id} className={clsx('rounded-[24px] border p-4 transition', isSelected ? 'border-[rgba(177,140,255,0.22)] bg-[rgba(177,140,255,0.08)]' : 'border-white/10 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]')}>
                    <div className="flex items-start gap-4">
                      <button type="button" onClick={() => setSelectedUserIds((prev) => { const next = new Set(prev); next.has(user.id) ? next.delete(user.id) : next.add(user.id); return next; })} className="mt-1 text-[var(--admin-text-soft)] transition hover:text-[var(--admin-text)]" aria-label={isSelected ? 'Deselect user' : 'Select user'}>
                        {isSelected ? <CheckSquare className="h-5 w-5 text-[var(--admin-signal)]" /> : <Square className="h-5 w-5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold', getAvatarTone(user.role))}>{user.name?.[0]?.toUpperCase() || '?'}</div>
                          <div className="min-w-0">
                            <Link href={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 text-lg font-semibold text-[var(--admin-text)] transition hover:text-[#ddceff]">
                              <span className="truncate">{user.name}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </Link>
                            <p className="truncate text-sm text-[var(--admin-text-soft)]">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone={getRoleTone(user.role)}>{getRoleLabel(user.role)}</span>
                          <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone={getTierTone(tierValue)}>{tierValue}</span>
                          {user.tenant_name ? <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{user.tenant_name}</span> : null}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Role</p>
                            <select value={user.role} onChange={(event) => void patchUser(user.id, { role: event.target.value }, 'User role updated', 'Failed to update user role')} className={`${adminSelectClassName} mt-2 w-full`}>
                              <option value="guest">Guest</option>
                              <option value="organizer">Organizer</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Plan</p>
                            <select value={tierValue} onChange={(event) => void patchUser(user.id, { subscription_tier: event.target.value }, user.role === 'super_admin' ? 'Account tier updated' : 'Tenant plan updated', user.role === 'super_admin' ? 'Failed to update account tier' : 'Failed to update tenant plan')} className={`${adminSelectClassName} mt-2 w-full capitalize`}>
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                              <option value="enterprise">Enterprise</option>
                              <option value="tester">Tester</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--admin-text-soft)]">
                          <span>Joined {formatRelativeDate(user.created_at)}</span>
                          <span>{user.last_login_at ? `Active ${formatRelativeDate(user.last_login_at)}` : 'Never logged in'}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <AdminActionButton href={`/admin/users/${user.id}`}>View user<ExternalLink className="h-4 w-4" /></AdminActionButton>
                          <AdminActionButton onClick={() => handleDeleteUser(user.id, user.name)} className="border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]">
                            <Trash2 className="h-4 w-4" />Delete
                          </AdminActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden xl:block">
              <table className="w-full">
                <thead className="admin-table-head">
                  <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
                    <th className="w-14 py-4 pl-5 pr-0">
                      <button type="button" onClick={() => selectedUserIds.size === users.length ? setSelectedUserIds(new Set()) : setSelectedUserIds(new Set(users.map((user) => user.id)))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[var(--admin-text-soft)] transition hover:text-[var(--admin-text)]" aria-label={selectedUserIds.size === users.length ? 'Deselect all' : 'Select all'}>
                        {selectedUserIds.size === users.length && users.length > 0 ? <CheckSquare className="h-4 w-4 text-[var(--admin-signal)]" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="px-3 py-4">User</th>
                    <th className="px-3 py-4">Tenant</th>
                    <th className="px-3 py-4">Role</th>
                    <th className="px-3 py-4">Plan</th>
                    <th className="px-3 py-4">Joined</th>
                    <th className="px-3 py-4">Last Active</th>
                    <th className="px-3 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const tierValue = getTierValue(user);
                    const isSelected = selectedUserIds.has(user.id);
                    return (
                      <tr key={user.id} className={clsx('admin-table-row group', isSelected ? 'bg-[rgba(177,140,255,0.08)]' : '')}>
                        <td className="py-4 pl-5 pr-0">
                          <button type="button" onClick={() => setSelectedUserIds((prev) => { const next = new Set(prev); next.has(user.id) ? next.delete(user.id) : next.add(user.id); return next; })} className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-[var(--admin-text-soft)] transition hover:border-white/10 hover:bg-white/[0.03] hover:text-[var(--admin-text)]" aria-label={isSelected ? 'Deselect user' : 'Select user'}>
                            {isSelected ? <CheckSquare className="h-4 w-4 text-[var(--admin-signal)]" /> : <Square className="h-4 w-4 opacity-60" />}
                          </button>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold', getAvatarTone(user.role))}>{user.name?.[0]?.toUpperCase() || '?'}</div>
                            <div className="min-w-0">
                              <Link href={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-text)] transition hover:text-[#ddceff]">
                                <span className="truncate">{user.name}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
                              </Link>
                              <p className="mt-1 truncate text-xs text-[var(--admin-text-soft)]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--admin-text-soft)]">{user.tenant_name || <span className="text-[var(--admin-text-muted)]">Unassigned</span>}</td>
                        <td className="px-3 py-4">
                          <select value={user.role} onChange={(event) => void patchUser(user.id, { role: event.target.value }, 'User role updated', 'Failed to update user role')} className={`${adminSelectClassName} h-10 w-full min-w-36`}>
                            <option value="guest">Guest</option>
                            <option value="organizer">Organizer</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="px-3 py-4">
                          <select value={tierValue} onChange={(event) => void patchUser(user.id, { subscription_tier: event.target.value }, user.role === 'super_admin' ? 'Account tier updated' : 'Tenant plan updated', user.role === 'super_admin' ? 'Failed to update account tier' : 'Failed to update tenant plan')} className={`${adminSelectClassName} h-10 w-full min-w-32 capitalize`}>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                            <option value="tester">Tester</option>
                          </select>
                        </td>
                        <td className="px-3 py-4 text-sm tabular-nums text-[var(--admin-text-soft)]" title={new Date(user.created_at).toLocaleString()}>{formatRelativeDate(user.created_at)}</td>
                        <td className="px-3 py-4 text-sm tabular-nums text-[var(--admin-text-soft)]" title={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : undefined}>{user.last_login_at ? formatRelativeDate(user.last_login_at) : <span className="text-[var(--admin-text-muted)]">Never</span>}</td>
                        <td className="px-3 py-4 pr-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100" style={{ opacity: isSelected ? 1 : undefined }}>
                            <AdminActionButton href={`/admin/users/${user.id}`} className="min-h-10 px-3 py-2 text-xs">View<ExternalLink className="h-3.5 w-3.5" /></AdminActionButton>
                            <button type="button" onClick={() => handleDeleteUser(user.id, user.name)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,108,122,0.18)] bg-[rgba(255,108,122,0.06)] text-[#ff9ba4] transition hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]" title="Delete user" aria-label={`Delete ${user.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <AdminActionButton onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" />Previous</AdminActionButton>
                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1];
                    const showEllipsis = previousPage && page - previousPage > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsis ? <span className="px-2 text-sm text-[var(--admin-text-muted)]">&hellip;</span> : null}
                        <button type="button" onClick={() => setCurrentPage(page)} className={clsx('flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition', page === currentPage ? 'border border-[rgba(177,140,255,0.32)] bg-[rgba(177,140,255,0.18)] text-[#e3d7ff]' : 'text-[var(--admin-text-soft)] hover:bg-white/[0.05] hover:text-[var(--admin-text)]')}>
                          {page}
                        </button>
                      </span>
                    );
                  })}
                </div>
                <AdminActionButton onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight className="h-4 w-4" /></AdminActionButton>
              </div>
            ) : null}
          </>
        )}
      </AdminPanel>

      <ConfirmDialog {...confirm.dialog} />
    </AdminPage>
  );
}
