'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Search,
  Users,
} from 'lucide-react';

import {
  ADMIN_SEARCH_MIN_QUERY_LENGTH,
  normalizeAdminSearchQuery,
} from '@/lib/domain/admin/search';
import type { AdminSearchData, AdminSearchEntityType, AdminSearchResult } from '@/lib/domain/admin/types';

const typeLabels: Record<AdminSearchEntityType, string> = {
  tenant: 'Tenant',
  event: 'Event',
  user: 'User',
};

const typeIcons: Record<AdminSearchEntityType, typeof Building2> = {
  tenant: Building2,
  event: Calendar,
  user: Users,
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ended: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  organizer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  super_admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  guest: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const emptySearchData: AdminSearchData = {
  query: '',
  results: [],
  counts: {
    tenant: 0,
    event: 0,
    user: 0,
  },
  limit: 12,
};

function getActionLabel(type: AdminSearchEntityType) {
  switch (type) {
    case 'tenant':
      return 'View tenant';
    case 'event':
      return 'View event';
    case 'user':
      return 'View user';
    default:
      return 'Open';
  }
}

export default function AdminSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedQuery = normalizeAdminSearchQuery(searchParams.get('q'));
  const [searchInput, setSearchInput] = useState(appliedQuery);
  const [results, setResults] = useState<AdminSearchData>(emptySearchData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    if (!appliedQuery) {
      setResults(emptySearchData);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (appliedQuery.length < ADMIN_SEARCH_MIN_QUERY_LENGTH) {
      setResults({
        ...emptySearchData,
        query: appliedQuery,
      });
      setError(`Enter at least ${ADMIN_SEARCH_MIN_QUERY_LENGTH} characters to search`);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(appliedQuery)}&limit=12`, {
          credentials: 'include',
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to search');
        }

        if (!cancelled) {
          setResults(payload.data || emptySearchData);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to search');
          setResults({
            ...emptySearchData,
            query: appliedQuery,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchResults();

    return () => {
      cancelled = true;
    };
  }, [appliedQuery]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = normalizeAdminSearchQuery(searchInput);

    if (!nextQuery) {
      router.replace('/admin/search');
      return;
    }

    router.replace(`/admin/search?q=${encodeURIComponent(nextQuery)}`);
  };

  const renderResultCard = (result: AdminSearchResult) => {
    const Icon = typeIcons[result.type];
    const statusColor = result.status ? statusColors[result.status] || statusColors.guest : null;

    return (
      <div
        key={`${result.type}-${result.id}`}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="rounded-lg bg-gray-100 p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-gray-900 dark:text-white">{result.title}</p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {typeLabels[result.type]}
                </span>
                {statusColor && result.status && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {result.status}
                  </span>
                )}
              </div>
              {result.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{result.subtitle}</p>
              )}
              {result.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{result.description}</p>
              )}
              {(result.tenantName || result.createdAt) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {result.tenantName ? `Tenant: ${result.tenantName}` : null}
                  {result.tenantName && result.createdAt ? ' | ' : null}
                  {result.createdAt ? `Created: ${new Date(result.createdAt).toLocaleString()}` : null}
                </p>
              )}
            </div>
          </div>
          <Link
            href={result.href}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {getActionLabel(result.type)}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Global Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search tenants, events, and users across the platform.
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

      <form
        onSubmit={handleSearch}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by tenant name, event code, email, or user name"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Minimum {ADMIN_SEARCH_MIN_QUERY_LENGTH} characters.
        </p>
      </form>

      {appliedQuery && !error && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            Query: {results.query || appliedQuery}
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Users: {results.counts.user}
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Events: {results.counts.event}
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Tenants: {results.counts.tenant}
          </span>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {!appliedQuery ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Search across tenants, events, and users from one place.
        </div>
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </div>
      ) : results.results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No matching tenants, events, or users were found.
        </div>
      ) : (
        <div className="space-y-3">{results.results.map(renderResultCard)}</div>
      )}
    </div>
  );
}
