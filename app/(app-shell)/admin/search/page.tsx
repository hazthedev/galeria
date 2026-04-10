'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowUpRight,
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
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminInputWithIconClassName,
} from '@/components/admin/control-plane';

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
  active: 'mint',
  ended: 'default',
  upcoming: 'signal',
  suspended: 'signal',
  trialing: 'mint',
  organizer: 'signal',
  super_admin: 'default',
  guest: 'default',
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
    const tone = result.status ? statusColors[result.status] || 'default' : 'default';

    return (
      <div
        key={`${result.type}-${result.id}`}
        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/16 hover:bg-white/[0.05]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15 text-[var(--admin-signal)]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold text-[var(--admin-text)]">{result.title}</p>
                <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                  {typeLabels[result.type]}
                </span>
                {result.status ? (
                  <span
                    className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                    data-tone={tone}
                  >
                    {result.status}
                  </span>
                ) : null}
              </div>
              {result.subtitle ? (
                <p className="text-sm leading-6 text-[var(--admin-text-soft)]">{result.subtitle}</p>
              ) : null}
              {result.description ? (
                <p className="text-sm leading-6 text-[var(--admin-text-muted)]">{result.description}</p>
              ) : null}
              {(result.tenantName || result.createdAt) ? (
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">
                  {result.tenantName ? `Tenant · ${result.tenantName}` : null}
                  {result.tenantName && result.createdAt ? '  •  ' : null}
                  {result.createdAt ? `Created · ${new Date(result.createdAt).toLocaleString()}` : null}
                </p>
              ) : null}
            </div>
          </div>
          <Link
            href={result.href}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[var(--admin-text-soft)] transition hover:border-[rgba(177,140,255,0.24)] hover:text-[var(--admin-text)]"
          >
            {getActionLabel(result.type)}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="System lookup"
        title="Global Search"
        description="A single search surface for identity, events, and tenant records so support work starts with the right context instead of guesswork."
        actions={
          <AdminActionButton href="/admin">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </AdminActionButton>
        }
      />

      <AdminPanel
        title="Search command"
        description="Use a tenant name, event code, email address, or person’s name."
        className="admin-reveal admin-reveal-delay-1"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tenant name, event code, email, or user name"
                className={adminInputWithIconClassName}
              />
            </div>
            <AdminActionButton variant="primary" className="lg:min-w-40" type="submit">
              Search now
            </AdminActionButton>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
              Minimum {ADMIN_SEARCH_MIN_QUERY_LENGTH} characters
            </span>
            {appliedQuery && !error ? (
              <>
                <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="signal">
                  Users {results.counts.user}
                </span>
                <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="signal">
                  Events {results.counts.event}
                </span>
                <span className="admin-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="mint">
                  Tenants {results.counts.tenant}
                </span>
              </>
            ) : null}
          </div>
        </form>
      </AdminPanel>

      {error ? (
        <div className="admin-reveal admin-reveal-delay-2 flex items-center gap-3 rounded-[24px] border border-[rgba(255,108,122,0.24)] bg-[rgba(255,108,122,0.08)] px-5 py-4 text-sm text-[#ffb8bf]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {!appliedQuery ? (
        <AdminPanel className="admin-reveal admin-reveal-delay-2">
          <AdminEmptyState
            icon={Search}
            title="Search the control plane"
            description="Start with the entity you know and follow the results into the correct workspace."
          />
        </AdminPanel>
      ) : isLoading ? (
        <AdminPanel className="admin-reveal admin-reveal-delay-2">
          <AdminLoadingState label="Searching the platform" />
        </AdminPanel>
      ) : results.results.length === 0 ? (
        <AdminPanel className="admin-reveal admin-reveal-delay-2">
          <AdminEmptyState
            icon={AlertCircle}
            title="No matching records"
            description="Try a broader name, another email, or an event short code."
          />
        </AdminPanel>
      ) : (
        <AdminPanel
          title={`Results for “${results.query || appliedQuery}”`}
          description="The strongest matches across tenants, events, and users."
          aside={
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--admin-signal-2)]" />
              Open record
            </div>
          }
          className="admin-reveal admin-reveal-delay-2"
        >
          <div className="space-y-3">{results.results.map(renderResultCard)}</div>
        </AdminPanel>
      )}
    </AdminPage>
  );
}
