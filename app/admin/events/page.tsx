// ============================================
// Galeria - Supervisor Events Management
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Calendar,
    Loader2,
    ExternalLink,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Event {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'ended' | 'archived';
    event_date: string;
    organizer_name?: string;
    photo_count?: number;
    created_at: string;
}

export default function SupervisorEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchEvents();
    }, [currentPage, statusFilter, searchQuery]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
            });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await fetch(`/api/events?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
            toast.error('Failed to load events');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Event deleted');
                fetchEvents();
            } else {
                toast.error('Failed to delete event');
            }
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'draft':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ended':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'archived':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    Event Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage all events across the system
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="ended">Ended</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {/* Events Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <Calendar className="mb-2 h-12 w-12 opacity-50" />
                        <p>No events found</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 p-4 md:hidden">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {event.name}
                                            </p>
                                            {event.organizer_name && (
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Organizer: {event.organizer_name}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={clsx(
                                                'rounded-full px-2 py-1 text-xs font-medium',
                                                getStatusBadgeColor(event.status)
                                            )}
                                        >
                                            {event.status}
                                        </span>
                                    </div>

                                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                                        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Date</dt>
                                            <dd className="mt-1">
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Photos</dt>
                                            <dd className="mt-1">{event.photo_count ?? 0}</dd>
                                        </div>
                                    </dl>

                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <Link
                                            href={`/organizer/events/${event.id}/admin`}
                                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Open Admin
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="-mx-4 hidden overflow-x-auto px-4 md:block md:px-0">
                            <table className="min-w-[700px] w-full">
                                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Event
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {event.name}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={clsx(
                                                        'rounded-full px-2 py-1 text-xs font-medium',
                                                        getStatusBadgeColor(event.status)
                                                    )}
                                                >
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/organizer/events/${event.id}/admin`}
                                                        className="flex h-11 w-11 items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                                        title="View event"
                                                        aria-label={`Open admin for ${event.name}`}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Delete event"
                                                        aria-label={`Delete ${event.name}`}
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
        </div>
    );
}
