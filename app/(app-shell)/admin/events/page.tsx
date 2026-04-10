'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import type { AdminEventListItem } from '@/lib/domain/admin/types';
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

const statusLabels: Record<string, string> = {
  active: 'Active',
  ended: 'Ended',
  upcoming: 'Upcoming',
};

const statusTones: Record<string, 'mint' | 'signal' | 'default'> = {
  active: 'mint',
  ended: 'default',
  upcoming: 'signal',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEventListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchEvents();
  }, [currentPage, statusFilter, tenantFilter]);

  const fetchEvents = async () => {
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
      if (tenantFilter !== 'all') {
        params.append('tenantId', tenantFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/events?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError('Failed to load events. The server returned an error.');
      }
    } catch (fetchError) {
      console.error('Failed to fetch events:', fetchError);
      setError('Failed to load events. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    void fetchEvents();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const uniqueTenants = Array.from(
    new Map(events.map((event) => [event.tenant_id, { id: event.tenant_id, name: event.tenant_name }])).values()
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Cross-tenant operations"
        title="All Events"
        description="Scan event activity across the platform, move from a list to an event workspace quickly, and keep a clear line of sight on status, attendance, and gallery volume."
        actions={
          <AdminActionButton href="/admin">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </AdminActionButton>
        }
      />

      <AdminPanel
        title="Event filters"
        description="Refine by event name, short code, tenant, or lifecycle state."
        className="admin-reveal admin-reveal-delay-1"
      >
        <form onSubmit={handleSearch} className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={adminInputWithIconClassName}
            />
          </div>

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
            <option value="ended">Ended</option>
            <option value="upcoming">Upcoming</option>
          </select>

          {uniqueTenants.length > 1 ? (
            <select
              value={tenantFilter}
              onChange={(event) => {
                setTenantFilter(event.target.value);
                setCurrentPage(1);
              }}
              className={adminSelectClassName}
            >
              <option value="all">All Tenants</option>
              {uniqueTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : null}

          <AdminActionButton variant="primary" type="submit" className="xl:min-w-36">
            Search
          </AdminActionButton>
        </form>
      </AdminPanel>

      <AdminPanel
        title="Event ledger"
        description="A high-density operational list for jumping from scan mode into action."
        className="admin-reveal admin-reveal-delay-2"
      >
        {isLoading ? (
          <AdminLoadingState label="Loading events" />
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-[rgba(255,108,122,0.24)] bg-[rgba(255,108,122,0.08)] px-6 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-[#ff9ba4]" />
            <p className="max-w-lg text-sm leading-6 text-[#ffd1d6]">{error}</p>
            <AdminActionButton onClick={() => void fetchEvents()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </AdminActionButton>
          </div>
        ) : events.length === 0 ? (
          <AdminEmptyState
            icon={Calendar}
            title="No events match these filters"
            description="Try removing a tenant filter or broadening the search terms."
          />
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="w-full">
                <thead className="admin-table-head">
                  <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
                    <th className="px-5 py-4">Event</th>
                    <th className="px-5 py-4">Tenant</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Photos</th>
                    <th className="px-5 py-4">Guests</th>
                    <th className="px-5 py-4">Attendance</th>
                    <th className="px-5 py-4">Dates</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="admin-table-row">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-lg font-semibold text-[var(--admin-text)]">{event.name}</p>
                          <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{event.short_code || 'No short code'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-[var(--admin-text-soft)]">
                          <Building2 className="h-4 w-4 text-[var(--admin-text-muted)]" />
                          <span>{event.tenant_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                          data-tone={statusTones[event.status] || 'default'}
                        >
                          {statusLabels[event.status] || event.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-[var(--admin-text-muted)]" />
                          {event.photo_count}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--admin-text-muted)]" />
                          {event.guest_count}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">{event.attendance_count}</td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-text-soft)]">
                        <div>
                          <p>{formatDate(event.event_date)}</p>
                          {event.expires_at && event.expires_at !== event.event_date ? (
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                              to {formatDate(event.expires_at)}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
                          >
                            View 360 <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          {event.short_code ? (
                            <Link
                              href={`/e/${event.short_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-text-soft)] transition hover:text-[var(--admin-text)]"
                            >
                              Guest page <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 xl:hidden">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--admin-text)]">{event.name}</p>
                      <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{event.short_code || 'No short code'}</p>
                    </div>
                    <span
                      className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      data-tone={statusTones[event.status] || 'default'}
                    >
                      {statusLabels[event.status] || event.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-[var(--admin-text-soft)]">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">Tenant</p>
                      <p className="mt-2">{event.tenant_name}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-[var(--admin-text-soft)]">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">Date</p>
                      <p className="mt-2">{formatDate(event.event_date)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Photos</p>
                      <p className="mt-2 text-[var(--admin-text)]">{event.photo_count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Guests</p>
                      <p className="mt-2 text-[var(--admin-text)]">{event.guest_count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Attendance</p>
                      <p className="mt-2 text-[var(--admin-text)]">{event.attendance_count}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <AdminActionButton href={`/admin/events/${event.id}`} variant="primary">
                      View event 360
                    </AdminActionButton>
                    {event.short_code ? (
                      <AdminActionButton href={`/e/${event.short_code}`} target="_blank" rel="noopener noreferrer">
                        Guest page
                      </AdminActionButton>
                    ) : null}
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
    </AdminPage>
  );
}
