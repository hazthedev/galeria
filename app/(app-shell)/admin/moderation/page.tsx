'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
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
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminInputWithIconClassName,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/control-plane';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  rejected: 'Rejected',
  approved: 'Approved',
};

const statusTones: Record<string, 'default' | 'signal' | 'mint'> = {
  pending: 'default',
  rejected: 'signal',
  approved: 'mint',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function formatSource(item: AdminModerationQueueItem) {
  if (item.latest_moderation_source) return item.latest_moderation_source;
  if (item.latest_scan_decision) return 'ai';
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

        if (!response.ok) return;
        if (isMounted) setAdminMfaEnabled(Boolean(payload.data?.enabled));
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

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

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
    if (isActionPending) return;
    setActionPhoto(null);
    setActionType(null);
    setActionReason('');
    setStepUpToken('');
  };

  const handleModerationAction = async () => {
    if (!actionPhoto || !actionType) return;

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
        headers: { 'Content-Type': 'application/json' },
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
        actionError instanceof Error ? actionError.message : 'Failed to process moderation action'
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
    <AdminPage>
      <AdminPageHeader
        eyebrow="Content control"
        title="Moderation Queue"
        description="Review pending and rejected media from one place, with clearer context around source signals, last action, and the consequence of every decision."
        actions={
          <AdminActionButton href="/admin">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </AdminActionButton>
        }
      />

      <AdminPanel
        title="Moderation filters"
        description="Search by tenant, event, contributor, or short code and refine by state or signal source."
        className="admin-reveal admin-reveal-delay-1"
      >
        <form onSubmit={handleSearch} className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tenant, event, contributor, or short code..."
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
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(event) => {
              setSourceFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={adminSelectClassName}
          >
            <option value="all">All Sources</option>
            <option value="ai">AI Signals</option>
            <option value="manual">Manual Actions</option>
          </select>

          <AdminActionButton variant="primary" type="submit">
            Search
          </AdminActionButton>
        </form>
      </AdminPanel>

      <AdminPanel
        title="Queue"
        description="Each record shows content context, signal provenance, and direct actions."
        className="admin-reveal admin-reveal-delay-2"
      >
        {isLoading ? (
          <AdminLoadingState label="Loading moderation queue" />
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-[rgba(255,108,122,0.24)] bg-[rgba(255,108,122,0.08)] px-6 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-[#ff9ba4]" />
            <p className="max-w-lg text-sm leading-6 text-[#ffd1d6]">{error}</p>
            <AdminActionButton onClick={() => void fetchQueue()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </AdminActionButton>
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Shield}
            title="No moderation items"
            description="Nothing matches the current filters."
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.photo_id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-black/10">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt={item.event_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--admin-text-muted)]">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-[var(--admin-text)]">
                            {item.contributor_name || 'Anonymous contributor'}
                          </p>
                          <span
                            className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                            data-tone={statusTones[item.photo_status] || 'default'}
                          >
                            {statusLabels[item.photo_status] || item.photo_status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-3">
                          <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Context</p>
                            <p className="mt-2 text-sm text-[var(--admin-text)]">{item.event_name}</p>
                            <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{item.tenant_name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                              {item.event_short_code ? `/${item.event_short_code}` : 'No short code'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Latest signal</p>
                            <p className="mt-2 text-sm text-[var(--admin-text)]">{formatDecision(item)}</p>
                            <p className="mt-1 text-sm text-[var(--admin-text-soft)]">
                              {formatSource(item)} | {formatDate(item.latest_moderation_at || item.latest_scan_at)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Reason</p>
                            <p className="mt-2 text-sm text-[var(--admin-text-soft)]">
                              {item.latest_moderation_reason || item.latest_scan_reason || 'No reason recorded'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                              Uploaded {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 xl:min-w-56">
                      {item.photo_status === 'pending' ? (
                        <>
                          <AdminActionButton
                            onClick={() => openActionDialog(item, 'approve_photo')}
                            className="border-[rgba(102,223,212,0.18)] bg-[rgba(102,223,212,0.08)] text-[#9ce7dd] hover:border-[rgba(102,223,212,0.3)] hover:bg-[rgba(102,223,212,0.12)] hover:text-[#c8f6ef]"
                          >
                            Approve
                          </AdminActionButton>
                          <AdminActionButton
                            onClick={() => openActionDialog(item, 'reject_photo')}
                            className="border-[rgba(240,174,97,0.2)] bg-[rgba(240,174,97,0.08)] text-[#f8c27c] hover:border-[rgba(240,174,97,0.3)] hover:bg-[rgba(240,174,97,0.12)] hover:text-[#ffd9a5]"
                          >
                            Reject
                          </AdminActionButton>
                        </>
                      ) : null}

                      <AdminActionButton
                        onClick={() => openActionDialog(item, 'delete_photo')}
                        className="border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]"
                      >
                        Delete
                      </AdminActionButton>

                      <AdminActionButton href={`/admin/events/${item.event_id}`}>
                        Event 360
                        <ExternalLink className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton href={`/admin/tenants/${item.tenant_id}`}>
                        Tenant 360
                        <ExternalLink className="h-4 w-4" />
                      </AdminActionButton>
                    </div>
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
        open={Boolean(actionPhoto && actionType)}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
        title={actionConfig.title}
        description={
          <div className="space-y-3">
            <p>
              {actionConfig.helper}
              {actionPhoto ? ` Event: ${actionPhoto.event_name}.` : ''}
            </p>
            <div className="space-y-2">
              <label htmlFor="moderation-reason" className="block text-sm font-medium text-gray-900 dark:text-white">
                Reason
              </label>
              <textarea
                id="moderation-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Explain why this moderation action is needed"
                className={adminTextareaClassName}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">This reason is stored in the admin audit log.</p>
            </div>
            {requiresStepUp ? (
              <div className="space-y-2">
                <label htmlFor="moderation-step-up-token" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Current MFA code
                </label>
                <input
                  id="moderation-step-up-token"
                  value={stepUpToken}
                  onChange={(event) => setStepUpToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={adminInputWithIconClassName.replace('pl-12 ', '')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Required because deleting a photo is permanent.</p>
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
    </AdminPage>
  );
}
