// ============================================
// MOMENTIQUE - Events List Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, SlidersHorizontal, Loader2, Calendar, Filter } from 'lucide-react';
import clsx from 'clsx';
import { EventCard } from '@/components/events/event-card';
import type { IEvent, EventStatus } from '@/lib/types';

interface EventsResponse {
  data: IEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

const statusOptions: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'archived', label: 'Archived' },
];

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<EventsResponse['pagination'] | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/events?${params.toString()}`, { headers });
      const data = await response.json() as EventsResponse | { error: string; message?: string };

      if (!response.ok) {
        throw new Error((data as { error: string; message?: string }).error || (data as { error: string; message?: string }).message || 'Failed to load events');
      }

      const eventsResponse = data as EventsResponse;
      let filteredEvents = eventsResponse.data;

      // Client-side search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(
          event =>
            event.name.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query) ||
            event.custom_hashtag?.toLowerCase().includes(query)
        );
      }

      setEvents(filteredEvents);
      setPagination(eventsResponse.pagination);

      // Fetch photo counts for each event
      for (const event of eventsResponse.data) {
        try {
          const photosRes = await fetch(`/api/events/${event.id}/photos?limit=1`, { headers });
          if (photosRes.ok) {
            const photosData = await photosRes.json();
            setPhotoCounts(prev => ({ ...prev, [event.id]: photosData.pagination?.total || 0 }));
          }
        } catch {
          setPhotoCounts(prev => ({ ...prev, [event.id]: 0 }));
        }
      }

      setError(null);
    } catch (err) {
      console.error('[EVENTS_PAGE] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, statusFilter]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete event');
      }

      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('[EVENTS_PAGE] Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Events</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your events and photo galleries
              </p>
            </div>
            <Link
              href="/events/new"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-violet-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search events by name, location, or hashtag..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-violet-500',
                showFilters
                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-900/20 dark:text-violet-300'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="status-filter" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as EventStatus | 'all')}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-8 text-center dark:bg-red-900/10">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-20 dark:border-gray-700">
            <Calendar className="mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No events yet</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get started by creating your first event
            </p>
            <Link
              href="/events/new"
              className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-700 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </div>
        ) : (
          <>
            {/* Events Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  photoCount={photoCounts[event.id] || 0}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.has_prev}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.has_next}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
