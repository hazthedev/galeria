'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminModerationQueueItem } from '@/lib/domain/admin/types';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  rejected: 'Rejected',
  approved: 'Approved',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function formatSource(item: AdminModerationQueueItem) {
  if (item.latest_moderation_source) {
    return item.latest_moderation_source;
  }

  if (item.latest_scan_decision) {
    return 'ai';
  }

  return 'queue';
}

function formatDecision(item: AdminModerationQueueItem) {
  return item.latest_moderation_action || item.latest_scan_decision || 'awaiting review';
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<AdminModerationQueueItem[]>([]);
  const [adminMfaEnabled, setAdminMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionPhoto, setActionPhoto] = useState<AdminModerationQueueItem | null>(null);
  const [actionType, setActionType] = useState<'approve_photo' | 'reject_photo' | 'delete_photo' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);
  const requiresStepUp = adminMfaEnabled && actionType === 'delete_photo';

  useEffect(() => {
    void fetchQueue();
  }, [currentPage, statusFilter, sourceFilter]);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminMfaStatus = async () => {
      try {
        const response = await fetch('/api/admin/mfa/status', {
          credentials: 'include',
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          return;
        }

        if (isMounted) {
          setAdminMfaEnabled(Boolean(payload.data?.enabled));
        }
      } catch {
        // Keep moderation usable even if the hint request fails.
      }
    };

    void fetchAdminMfaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchQueue = async () => {
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

      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/moderation?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load moderation queue');
      }

      const payload = await response.json();
      setItems(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load moderation queue');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    void fetchQueue();
  };

  const openActionDialog = (
    item: AdminModerationQueueItem,
    action: 'approve_photo' | 'reject_photo' | 'delete_photo'
  ) => {
    setActionPhoto(item);
    setActionType(action);
    setActionReason('');
  };

  const closeActionDialog = () => {
    if (isActionPending) {
      return;
    }

    setActionPhoto(null);
    setActionType(null);
    setActionReason('');
    setStepUpToken('');
  };

  const handleModerationAction = async () => {
    if (!actionPhoto || !actionType) {
      return;
    }

    const normalizedReason = actionReason.trim();
    if (!normalizedReason) {
      toast.error('Please add a reason before confirming');
      return;
    }

    setIsActionPending(true);

    try {
      const response = await fetch(`/api/admin/moderation/${actionPhoto.photo_id}/actions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType,
          reason: normalizedReason,
          metadata: requiresStepUp ? { step_up_token: stepUpToken.trim() } : undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.code === 'STEP_UP_REQUIRED') {
          setAdminMfaEnabled(true);
          throw new Error('Enter your current MFA code to continue');
        }
        if (payload.code === 'STEP_UP_INVALID') {
          setAdminMfaEnabled(true);
          throw new Error('That MFA code is invalid. Please try again.');
        }
        throw new Error(payload.error || 'Failed to process moderation action');
      }

      toast.success(payload.data?.message || 'Moderation action completed');
      closeActionDialog();
      await fetchQueue();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : 'Failed to process moderation action'
      );
    } finally {
      setIsActionPending(false);
    }
  };

  const getActionConfig = (action: 'approve_photo' | 'reject_photo' | 'delete_photo' | null) => {
    switch (action) {
      case 'approve_photo':
        return {
          title: 'Approve Photo',
          confirmLabel: 'Approve Photo',
          variant: 'primary' as const,
          helper: 'This will move the photo into the approved gallery.',
        };
      case 'reject_photo':
        return {
          title: 'Reject Photo',
          confirmLabel: 'Reject Photo',
          variant: 'warning' as const,
          helper: 'This will keep the photo out of the live gallery.',
        };
      case 'delete_photo':
        return {
          title: 'Delete Photo',
          confirmLabel: 'Delete Photo',
          variant: 'danger' as const,
          helper: 'This permanently deletes the photo and its stored assets.',
        };
      default:
        return {
          title: 'Moderation Action',
          confirmLabel: 'Confirm',
          variant: 'primary' as const,
          helper: '',
        };
    }
  };

  const actionConfig = getActionConfig(actionType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Moderation Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review pending and rejected photos across every tenant.
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

      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tenant, event, contributor, or short code..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(event) => {
            setSourceFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Sources</option>
          <option value="ai">AI Signals</option>
          <option value="manual">Manual Actions</option>
        </select>
      </form>

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
              onClick={() => void fetchQueue()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Shield className="mb-2 h-12 w-12 opacity-50" />
            <p>No moderation items match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Context</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Latest Signal</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.photo_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.event_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.contributor_name || 'Anonymous contributor'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Uploaded {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">{item.event_name}</p>
                          <p className="text-gray-500 dark:text-gray-400">{item.tenant_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {item.event_short_code ? `/${item.event_short_code}` : 'No short code'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            statusColors[item.photo_status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[item.photo_status] || item.photo_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-900 dark:text-white">{formatDecision(item)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatSource(item)} | {formatDate(item.latest_moderation_at || item.latest_scan_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {item.latest_moderation_reason || item.latest_scan_reason || 'No reason recorded'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {item.photo_status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionDialog(item, 'approve_photo')}
                                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionDialog(item, 'reject_photo')}
                                className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openActionDialog(item, 'delete_photo')}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Delete
                          </button>
                          <Link
                            href={`/admin/events/${item.event_id}`}
                            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                          >
                            Event 360
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <Link
                            href={`/admin/tenants/${item.tenant_id}`}
                            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-300"
                          >
                            Tenant 360
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {items.map((item) => (
                <div
                  key={item.photo_id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.event_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.contributor_name || 'Anonymous contributor'}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            statusColors[item.photo_status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[item.photo_status] || item.photo_status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.event_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.tenant_name}</p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {formatDecision(item)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatSource(item)} | {formatDate(item.latest_moderation_at || item.latest_scan_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                    {item.latest_moderation_reason || item.latest_scan_reason || 'No reason recorded'}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.photo_status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openActionDialog(item, 'approve_photo')}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionDialog(item, 'reject_photo')}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openActionDialog(item, 'delete_photo')}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                    <Link
                      href={`/admin/events/${item.event_id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/20 dark:text-violet-300"
                    >
                      Event 360
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/admin/tenants/${item.tenant_id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Tenant 360
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {item.photo_status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => openActionDialog(item, 'delete_photo')}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300 sm:col-span-2"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(actionPhoto && actionType)}
        onOpenChange={(open) => {
          if (!open) {
            closeActionDialog();
          }
        }}
        title={actionConfig.title}
        description={
          <div className="space-y-3">
            <p>
              {actionConfig.helper}
              {actionPhoto ? ` Event: ${actionPhoto.event_name}.` : ''}
            </p>
            <div className="space-y-2">
              <label
                htmlFor="moderation-reason"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                Reason
              </label>
              <textarea
                id="moderation-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Explain why this moderation action is needed"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This reason is stored in the admin audit log.
              </p>
            </div>
            {requiresStepUp ? (
              <div className="space-y-2">
                <label
                  htmlFor="moderation-step-up-token"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Current MFA code
                </label>
                <input
                  id="moderation-step-up-token"
                  value={stepUpToken}
                  onChange={(event) => setStepUpToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required because deleting a photo is permanent.
                </p>
              </div>
            ) : null}
          </div>
        }
        confirmLabel={actionConfig.confirmLabel}
        cancelLabel="Cancel"
        onConfirm={handleModerationAction}
        variant={actionConfig.variant}
        isPending={isActionPending}
        confirmDisabled={!actionReason.trim() || (requiresStepUp && !/^\d{6}$/.test(stepUpToken))}
      />
    </div>
  );
}
