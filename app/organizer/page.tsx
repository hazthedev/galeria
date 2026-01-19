'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { IEvent, EventStatus } from '@/lib/types';
import { EventCard } from '@/components/events/event-card';
import {
    Plus,
    Calendar,
    Image as ImageIcon,
    TrendingUp,
    Loader2,
    Search,
    Filter
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

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

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [events, setEvents] = useState<IEvent[]>([]);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalPhotos: 0,
        activeEvents: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<EventsResponse['pagination'] | null>(null);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
                sort: 'created_at',
                order: 'desc'
            });

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/events?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                let filteredEvents = data.data || [];

                // Client-side search filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    filteredEvents = filteredEvents.filter(
                        (event: IEvent) =>
                            event.name.toLowerCase().includes(query) ||
                            event.description?.toLowerCase().includes(query) ||
                            event.location?.toLowerCase().includes(query) ||
                            event.custom_hashtag?.toLowerCase().includes(query)
                    );
                }

                setEvents(filteredEvents);
                setPagination(data.pagination);

                // Calculate stats from full dataset
                setStats({
                    totalEvents: data.pagination?.total || 0,
                    totalPhotos: 0,
                    activeEvents: (data.data || []).filter((e: IEvent) => e.status === 'active').length
                });

                // Fetch photo counts for these events IN PARALLEL (not sequential!)
                const eventIds = (data.data || []).map((e: IEvent) => e.id);
                const photoCountPromises = eventIds.map(async (eventId: string) => {
                    try {
                        const photosRes = await fetch(`/api/events/${eventId}/photos?limit=1`);
                        if (photosRes.ok) {
                            const photosData = await photosRes.json();
                            return { eventId, count: photosData.pagination?.total || 0 };
                        }
                    } catch (e) {
                        console.error(`Failed to fetch photos for event ${eventId}`, e);
                    }
                    return { eventId, count: 0 };
                });

                const photoResults = await Promise.all(photoCountPromises);
                const counts: Record<string, number> = {};
                let totalPhotosCount = 0;

                for (const { eventId, count } of photoResults) {
                    counts[eventId] = count;
                    totalPhotosCount += count;
                }

                setPhotoCounts(counts);
                setStats(prev => ({ ...prev, totalPhotos: totalPhotosCount }));
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [currentPage, statusFilter]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchDashboardData();
            } else {
                setCurrentPage(1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete event');
            }

            setEvents(prev => prev.filter(e => e.id !== eventId));
            setStats(prev => ({ ...prev, totalEvents: prev.totalEvents - 1 }));
            toast.success('Event deleted successfully');
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to delete event');
        }
    };

    if (isLoading && events.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 pt-16 sm:px-6 lg:px-8 lg:pt-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        Welcome back,{' '}
                        {isAuthLoading ? (
                            <span className="h-8 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                        ) : (
                            user?.name?.split(' ')[0] || user?.name || 'Guest'
                        )}!
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Here's what's happening with your events.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalEvents}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                                <ImageIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Photos</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPhotos}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Events</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeEvents}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Header with Search */}
                <div className="mb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Events</h2>
                        <Link
                            href="/organizer/events/new"
                            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-violet-700 hover:to-pink-700"
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

                {/* Events List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-20 dark:border-gray-700">
                        <Calendar className="mb-4 h-16 w-16 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No events found</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first event'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Link
                                href="/organizer/events/new"
                                className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-700 hover:to-pink-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Event
                            </Link>
                        )}
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
