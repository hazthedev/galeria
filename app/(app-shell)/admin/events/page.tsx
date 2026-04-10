// ============================================
// Galeria - Admin Events Management Page
// ============================================
// Super admin interface for viewing events across all tenants

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  Users,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { AdminEventListItem } from '@/lib/domain/admin/types';

const statusLabels: Record<string, string> = {
  active: 'Active',
  ended: 'Ended',
  upcoming: 'Upcoming',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ended: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
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
    fetchEvents();
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
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Failed to load events. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Extract unique tenants from events for filter
  const uniqueTenants = Array.from(
    new Map(events.map((event) => [event.tenant_id, { id: event.tenant_id, name: event.tenant_name }])).values()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            All Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View events across all tenants
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
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

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
          <option value="ended">Ended</option>
          <option value="upcoming">Upcoming</option>
        </select>

        {uniqueTenants.length > 1 && (
          <select
            value={tenantFilter}
            onChange={(e) => {
              setTenantFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="all">All Tenants</option>
            {uniqueTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        )}
      </form>

      {/* Events List */}
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
              onClick={fetchEvents}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Calendar className="mb-2 h-12 w-12 opacity-50" />
            <p>No events found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Photos</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.name}
                          </p>
                          <p className="text-sm text-gray-500">{event.short_code || 'No short code'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Building2 className="h-4 w-4" />
                          <span>{event.tenant_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[event.status] || statusColors.ended}`}>
                          {statusLabels[event.status] || event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          {event.photo_count}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.guest_count}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.attendance_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <p>{formatDate(event.event_date)}</p>
                          {event.expires_at && event.expires_at !== event.event_date && (
                            <p className="text-xs text-gray-400">to {formatDate(event.expires_at)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                          >
                            View 360 <ExternalLink className="h-3 w-3" />
                          </Link>
                          {event.short_code ? (
                            <Link
                              href={`/e/${event.short_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-300"
                            >
                              Guest Page <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {event.name}
                      </p>
                      <p className="text-sm text-gray-500">{event.short_code || 'No short code'}</p>
                    </div>
                    <span className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusColors[event.status] || statusColors.ended}`}>
                      {statusLabels[event.status] || event.status}
                    </span>
                  </div>

                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{event.tenant_name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Photos</span>
                      <p className="mt-1">{event.photo_count}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Guests</span>
                      <p className="mt-1">{event.guest_count}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Check-ins</span>
                      <p className="mt-1">{event.attendance_count}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-gray-500 dark:text-gray-500">Event Date</span>
                    <p className="mt-1">{formatDate(event.event_date)}</p>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-center text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                    >
                      View Event 360 <ExternalLink className="h-3 w-3" />
                    </Link>
                    {event.short_code ? (
                      <Link
                        href={`/e/${event.short_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Open Guest Page <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : null}
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
    </div>
  );
}
