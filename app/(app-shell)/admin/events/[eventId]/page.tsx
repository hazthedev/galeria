'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Shield,
  Sparkles,
  Ticket,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/control-plane';
import type { AdminEventDetailData } from '@/lib/domain/admin/types';

const statusLabels: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  ended: 'Ended',
  archived: 'Archived',
};

type DialogKind = 'change-status' | 'enable-uploads' | 'disable-uploads';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function formatShortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : 'Not available';
}

function formatLag(seconds: number | null) {
  if (seconds === null) {
    return 'Not available';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function getFeatureEnabled(
  settings: Record<string, unknown> | null,
  key: string,
  defaultValue = false
) {
  const features =
    settings &&
    typeof settings === 'object' &&
    'features' in settings &&
    settings.features &&
    typeof settings.features === 'object'
      ? (settings.features as Record<string, unknown>)
      : null;

  if (!features || !(key in features)) {
    return defaultValue;
  }

  return Boolean(features[key]);
}

function getActionSuccessMessage(dialogKind: DialogKind) {
  switch (dialogKind) {
    case 'change-status':
      return 'Event status updated';
    case 'enable-uploads':
      return 'Uploads enabled';
    case 'disable-uploads':
      return 'Uploads disabled';
    default:
      return 'Event updated';
  }
}

function getStatusTone(status: string): 'mint' | 'signal' | 'default' {
  if (status === 'active') return 'mint';
  if (status === 'archived') return 'signal';
  return 'default';
}

export default function AdminEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;
  const [detail, setDetail] = useState<AdminEventDetailData | null>(null);
  const [adminMfaEnabled, setAdminMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [dialogKind, setDialogKind] = useState<DialogKind | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const requiresStepUp =
    adminMfaEnabled &&
    (dialogKind === 'change-status' || dialogKind === 'disable-uploads');

  const fetchDetail = async () => {
    if (!eventId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load event');
      }

      setDetail(payload.data);
      setSelectedStatus(payload.data.event.status);
    } catch (fetchError) {
      setDetail(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [eventId]);

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
        // Keep the page usable if the status hint fails.
      }
    };

    void fetchAdminMfaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <AdminLoadingState label="Loading event workspace" />;
  }

  if (error || !detail) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Event 360"
          title="Event not available"
          description="The requested event record could not be loaded."
          actions={
            <AdminActionButton href="/admin/events">
              <ChevronLeft className="h-4 w-4" />
              Back to events
            </AdminActionButton>
          }
        />
        <AdminPanel className="admin-reveal admin-reveal-delay-1">
          <AdminEmptyState
            icon={AlertCircle}
            title="Event not found"
            description={error || 'Event not found.'}
            action={
              <AdminActionButton onClick={() => void fetchDetail()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </AdminActionButton>
            }
          />
        </AdminPanel>
      </AdminPage>
    );
  }

  const publicHref = detail.event.short_code ? `/e/${detail.event.short_code}` : null;
  const organizerHref = `/organizer/events/${detail.event.id}/admin`;
  const tenantHref = `/admin/tenants/${detail.event.tenant_id}`;
  const uploadsEnabled = getFeatureEnabled(detail.event.settings, 'photo_upload_enabled', true);
  const featureFlags = [
    { label: 'uploads', enabled: uploadsEnabled },
    { label: 'lucky draw', enabled: getFeatureEnabled(detail.event.settings, 'lucky_draw_enabled') },
    { label: 'reactions', enabled: getFeatureEnabled(detail.event.settings, 'reactions_enabled', true) },
    { label: 'moderation', enabled: getFeatureEnabled(detail.event.settings, 'moderation_required') },
    { label: 'anonymous', enabled: getFeatureEnabled(detail.event.settings, 'anonymous_allowed', true) },
  ];
  const dialogConfig = useMemo(() => {
    if (!detail || !dialogKind) {
      return null;
    }

    return {
      title:
        dialogKind === 'change-status'
          ? 'Change event status'
          : dialogKind === 'enable-uploads'
            ? 'Enable uploads'
            : 'Disable uploads',
      description:
        (
          <div className="space-y-4">
            <p>
              {dialogKind === 'change-status'
                ? `Change ${detail.event.name} from ${statusLabels[detail.event.status] || detail.event.status} to ${statusLabels[selectedStatus] || selectedStatus}?`
                : dialogKind === 'enable-uploads'
                  ? `Enable guest uploads for ${detail.event.name}? Existing photos remain available and new uploads will be accepted immediately.`
                  : `Disable guest uploads for ${detail.event.name}? Existing photos remain visible, but new guest uploads will be blocked immediately.`}
            </p>
            {requiresStepUp ? (
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Current MFA code
                </span>
                <input
                  value={stepUpToken}
                  onChange={(event) => setStepUpToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={`${adminSelectClassName} mt-2 w-full`}
                />
                <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                  Required because this override changes event availability for guests.
                </span>
              </label>
            ) : null}
          </div>
        ),
      confirmLabel:
        dialogKind === 'change-status'
          ? 'Update status'
          : dialogKind === 'enable-uploads'
            ? 'Enable uploads'
            : 'Disable uploads',
      variant:
        dialogKind === 'disable-uploads'
          ? ('warning' as const)
          : ('primary' as const),
      confirmDisabled:
        actionReason.trim().length === 0 ||
        (dialogKind === 'change-status' && selectedStatus === detail.event.status) ||
        (requiresStepUp && !/^\d{6}$/.test(stepUpToken)),
    };
  }, [actionReason, detail, dialogKind, requiresStepUp, selectedStatus, stepUpToken]);

  const handleConfirmedAction = async () => {
    if (!detail || !eventId || !dialogKind) {
      return;
    }

    setIsActionPending(true);

    try {
      const metadata: Record<string, unknown> = {};
      if (dialogKind === 'change-status') {
        metadata.status = selectedStatus;
      }
      if (requiresStepUp) {
        metadata.step_up_token = stepUpToken.trim();
      }

      const response = await fetch(`/api/admin/events/${eventId}/actions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          dialogKind === 'change-status'
            ? {
                action: 'set_status',
                reason: actionReason.trim(),
                metadata,
              }
            : {
                action: dialogKind === 'enable-uploads' ? 'enable_uploads' : 'disable_uploads',
                reason: actionReason.trim(),
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
              }
        ),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.code === 'STEP_UP_REQUIRED') {
          setAdminMfaEnabled(true);
          throw new Error('Enter your current MFA code to continue');
        }
        if (payload.code === 'STEP_UP_INVALID') {
          setAdminMfaEnabled(true);
          throw new Error('That MFA code is invalid. Please try again.');
        }
        throw new Error(payload.error || 'Failed to update event');
      }

      toast.success(getActionSuccessMessage(dialogKind));
      setActionReason('');
      setStepUpToken('');
      setDialogKind(null);
      await fetchDetail();
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update event');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Event 360"
        title={detail.event.name}
        description="A guided support view of guest activity, upload health, engagement programs, and the privileged controls that change event availability."
        actions={
          <>
            <AdminActionButton onClick={() => void fetchDetail()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </AdminActionButton>
            <AdminActionButton href="/admin/events">
              <ChevronLeft className="h-4 w-4" />
              Back to events
            </AdminActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Uploads"
          value={detail.uploadHealth.total_uploads}
          detail={`${detail.uploadHealth.uploads_last_24h} in the last 24h`}
          icon={Upload}
          tone="mint"
        />
        <AdminStatCard
          label="Guests"
          value={detail.attendance.total_guests}
          detail={`${detail.attendance.unique_attendees} unique attendees`}
          icon={Users}
        />
        <AdminStatCard
          label="Check-ins"
          value={detail.attendance.total_checkins}
          detail={`Last check-in ${formatShortDate(detail.attendance.last_checkin_at)}`}
          icon={Calendar}
        />
        <AdminStatCard
          label="Reactions"
          value={detail.galleryState.total_reactions}
          detail="Across approved and pending gallery items"
          icon={Sparkles}
          tone="signal"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <div className="space-y-6">
          <AdminPanel title="Event Brief" description="Identity, ownership, timing, and guest-facing configuration.">
            <div className="mb-4 flex flex-wrap gap-2">
              <span
                className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                data-tone={getStatusTone(detail.event.status)}
              >
                {statusLabels[detail.event.status] || detail.event.status}
              </span>
              <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                {detail.event.tenant_name}
              </span>
            </div>
            <div className="mt-4 grid gap-4 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tenant</p>
                <Link href={tenantHref} className="mt-1 inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                  {detail.event.tenant_name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Organizer</p>
                <p className="mt-1">{detail.event.organizer_name || detail.event.organizer_email || 'Unknown organizer'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Event Date</p>
                <p className="mt-1">{formatDate(detail.event.event_date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Expires</p>
                <p className="mt-1">{formatDate(detail.event.expires_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
                <p className="mt-1">{detail.event.location || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tenant Tier</p>
                <p className="mt-1">{detail.event.tenant_tier || 'Unknown'}</p>
              </div>
            </div>
            {detail.event.description ? (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {detail.event.description}
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel
            title="Guest & Upload Signals"
            description="Operational health for uploads, moderation, and on-the-day attendance."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[var(--admin-signal)]" />
                    <p className="font-semibold text-[var(--admin-text)]">Upload Health</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Approved</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.uploadHealth.approved_uploads}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Pending</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.uploadHealth.pending_uploads}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Rejected</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.uploadHealth.rejected_uploads}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Avg Process Lag</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{formatLag(detail.uploadHealth.avg_processing_lag_seconds)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--admin-text-soft)]">
                    Last upload {formatDate(detail.uploadHealth.last_upload_at)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--admin-signal-2)]" />
                    <p className="font-semibold text-[var(--admin-text)]">Moderation State</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Pending Photos</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.moderation.pending_photos}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Rejected Photos</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.moderation.rejected_photos}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Review Scans</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.moderation.review_scans}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Rejected Scans</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">{detail.moderation.rejected_scans}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--admin-text-soft)]">
                    Last moderated {formatDate(detail.moderation.last_moderated_at)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--admin-signal)]" />
                    <p className="font-semibold text-[var(--admin-text)]">Attendance</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <span className="text-[var(--admin-text-soft)]">Total guests</span>
                      <span className="font-semibold text-[var(--admin-text)]">{detail.attendance.total_guests}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <span className="text-[var(--admin-text-soft)]">Unique attendees</span>
                      <span className="font-semibold text-[var(--admin-text)]">{detail.attendance.unique_attendees}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <span className="text-[var(--admin-text-soft)]">Check-ins</span>
                      <span className="font-semibold text-[var(--admin-text)]">{detail.attendance.total_checkins}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                      <span className="text-[var(--admin-text-soft)]">Reactions</span>
                      <span className="font-semibold text-[var(--admin-text)]">{detail.galleryState.total_reactions}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-[var(--admin-text)]">Top Contributors</p>
                  {detail.topContributors.length === 0 ? (
                    <p className="mt-4 text-sm text-[var(--admin-text-soft)]">No named contributors yet.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {detail.topContributors.map((contributor) => (
                        <div
                          key={contributor.id}
                          className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/10 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-[var(--admin-text)]">{contributor.name}</p>
                            <p className="text-sm text-[var(--admin-text-soft)]">
                              {contributor.email || 'Anonymous contributor'}
                            </p>
                          </div>
                          <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                            {contributor.photo_count} uploads
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Recent Moderation"
            description="Latest moderation decisions and their operator context."
          >
            {detail.recentModeration.length === 0 ? (
              <AdminEmptyState
                icon={Shield}
                title="No moderation activity"
                description="No moderation actions are logged for this event yet."
              />
            ) : (
              <div className="space-y-3">
                {detail.recentModeration.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--admin-text)]">{item.action}</p>
                        <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                          {item.moderator_name || item.moderator_email || 'System'} | {item.source}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--admin-text-muted)]">{formatDate(item.created_at)}</span>
                    </div>
                    {item.reason ? (
                      <p className="mt-3 text-sm text-[var(--admin-text-soft)]">{item.reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Support Links" description="Jump to adjacent workspaces around this event.">
            <div className="grid gap-3">
              <AdminActionButton href={tenantHref}>
                <Building2 className="h-4 w-4" />
                View Tenant 360
              </AdminActionButton>

              <AdminActionButton href={organizerHref}>
                <Shield className="h-4 w-4" />
                Open Organizer Admin
              </AdminActionButton>

              {publicHref ? (
                <AdminActionButton
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Guest Page
                </AdminActionButton>
              ) : null}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Support Actions"
            description="Privileged controls that change event availability for guests and organizers."
          >
            <label className="block">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                Action reason
              </span>
              <textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={3}
                placeholder="Reason for the next privileged action"
                className={`${adminTextareaClassName} mt-2`}
              />
            </label>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[var(--admin-text-soft)]">Current status</span>
                <span className="font-semibold text-[var(--admin-text)]">
                  {statusLabels[detail.event.status] || detail.event.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[var(--admin-text-soft)]">Guest uploads</span>
                <span className="font-semibold text-[var(--admin-text)]">
                  {uploadsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[var(--admin-text-soft)]">Tenant tier</span>
                <span className="font-semibold text-[var(--admin-text)]">
                  {detail.event.tenant_tier || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className={`${adminSelectClassName} flex-1`}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="archived">Archived</option>
              </select>

              <AdminActionButton
                disabled={selectedStatus === detail.event.status}
                onClick={() => setDialogKind('change-status')}
                variant="primary"
              >
                <Calendar className="h-4 w-4" />
                Apply Status
              </AdminActionButton>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {uploadsEnabled ? (
                <AdminActionButton onClick={() => setDialogKind('disable-uploads')}>
                  <Ban className="h-4 w-4" />
                  Disable Uploads
                </AdminActionButton>
              ) : (
                <AdminActionButton onClick={() => setDialogKind('enable-uploads')} variant="primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Enable Uploads
                </AdminActionButton>
              )}

              <div className="flex min-h-11 items-center gap-2 rounded-[18px] border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--admin-text-soft)]">
                <Upload className="h-4 w-4 text-[var(--admin-signal)]" />
                Existing uploads remain visible either way.
              </div>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Engagement Programs"
            description="Audience mechanics that change participation and incentives."
          >
            <div className="grid gap-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[var(--admin-signal)]" />
                  <p className="font-semibold text-[var(--admin-text)]">Lucky Draw</p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Enabled</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.luckyDraw.enabled ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Config status</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.luckyDraw.status || 'Not configured'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Entries</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.luckyDraw.total_entries}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Winners</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.luckyDraw.total_winners}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[var(--admin-text-soft)]">
                  Last draw {formatDate(detail.luckyDraw.last_draw_at)}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--admin-signal-2)]" />
                  <p className="font-semibold text-[var(--admin-text)]">Photo Challenge</p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Enabled</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.photoChallenge.enabled ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Goal</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.photoChallenge.goal_photos ?? 'Not configured'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Participants</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.photoChallenge.participant_count}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Goal reached</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.photoChallenge.goal_reached_count}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-[var(--admin-text-soft)]">Claims</span>
                    <span className="font-semibold text-[var(--admin-text)]">{detail.photoChallenge.claimed_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Feature Flags" description="Event-level capabilities currently stored for this workspace.">
            <div className="flex flex-wrap gap-2">
              {featureFlags.map(({ label, enabled }) => (
                <span
                  key={label}
                  className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                  data-tone={enabled ? 'mint' : 'default'}
                >
                  {label}: {enabled ? 'on' : 'off'}
                </span>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Audit Timeline" description="Recent admin actions affecting this event.">
            {detail.recentAudit.length === 0 ? (
              <AdminEmptyState
                icon={AlertCircle}
                title="No audit activity"
                description="No event-specific audit activity has been recorded yet."
              />
            ) : (
              <div className="space-y-3">
                {detail.recentAudit.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--admin-text)]">{item.action}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">
                          {item.admin_name || item.admin_email || 'Unknown admin'}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--admin-text-muted)]">{formatDate(item.created_at)}</span>
                    </div>
                    {item.reason ? (
                      <p className="mt-3 text-sm text-[var(--admin-text-soft)]">{item.reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>
      </div>

      <ConfirmDialog
        open={!!dialogConfig}
        onOpenChange={(open) => {
          if (!open) {
            setDialogKind(null);
            setStepUpToken('');
          }
        }}
        title={dialogConfig?.title || ''}
        description={dialogConfig?.description || ''}
        confirmLabel={dialogConfig?.confirmLabel}
        onConfirm={handleConfirmedAction}
        variant={dialogConfig?.variant}
        isPending={isActionPending}
        confirmDisabled={dialogConfig?.confirmDisabled}
      />
    </AdminPage>
  );
}
