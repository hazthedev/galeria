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
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Ticket,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminEventDetailData } from '@/lib/domain/admin/types';

const statusLabels: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  ended: 'Ended',
  archived: 'Archived',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ended: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

type DialogKind = 'change-status' | 'enable-uploads' | 'disable-uploads';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not available';
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
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error || 'Event not found'}</p>
          <button
            onClick={() => void fetchDetail()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
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
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Events
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {detail.event.name}
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[detail.event.status] || statusColors.ended}`}
            >
              {statusLabels[detail.event.status] || detail.event.status}
            </span>
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {detail.event.tenant_name}
            </span>
          </div>

          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {detail.event.short_code ? (
              <span className="font-mono text-sm">/{detail.event.short_code}</span>
            ) : (
              <span className="text-sm">No short code</span>
            )}
            {' | '}
            Created {formatDate(detail.event.created_at)}
          </p>
        </div>

        <button
          onClick={() => void fetchDetail()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Uploads</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.uploadHealth.total_uploads}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.uploadHealth.uploads_last_24h} in the last 24h
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Guests</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.attendance.total_guests}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.attendance.unique_attendees} unique attendees
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-ins</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.attendance.total_checkins}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Last check-in {formatDate(detail.attendance.last_checkin_at)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reactions</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.galleryState.total_reactions}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Across approved and pending gallery items
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
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
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Health</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Approved</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.uploadHealth.approved_uploads}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.uploadHealth.pending_uploads}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.uploadHealth.rejected_uploads}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Upload</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDate(detail.uploadHealth.last_upload_at)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Processing Lag</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatLag(detail.uploadHealth.avg_processing_lag_seconds)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reactions</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{detail.galleryState.total_reactions}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Guests</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.attendance.total_guests}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Unique Attendees</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.attendance.unique_attendees}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-ins</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{detail.attendance.total_checkins}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Contributors</h2>
            <div className="mt-4 space-y-3">
              {detail.topContributors.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No named contributors yet.</p>
              ) : (
                detail.topContributors.map((contributor) => (
                  <div key={contributor.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{contributor.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contributor.photo_count} uploads</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Top contributor
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Moderation</h2>
            <div className="mt-4 space-y-3">
              {detail.recentModeration.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No moderation actions logged for this event yet.</p>
              ) : (
                detail.recentModeration.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.moderator_name || item.moderator_email || 'System'} | {item.source}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.created_at)}</span>
                    </div>
                    {item.reason ? (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.reason}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support Links</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href={tenantHref}
                className="inline-flex min-h-11 items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  View Tenant 360
                </span>
                <ExternalLink className="h-4 w-4" />
              </Link>

              <Link
                href={organizerHref}
                className="inline-flex min-h-11 items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Open Organizer Admin
                </span>
                <ExternalLink className="h-4 w-4" />
              </Link>

              {publicHref ? (
                <Link
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30"
                >
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Guest Page
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support Actions</h2>

            <label className="mt-4 block text-sm text-gray-600 dark:text-gray-300">
              Action reason
              <textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={3}
                placeholder="Reason for the next privileged action"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
              />
            </label>

            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Current status</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statusLabels[detail.event.status] || detail.event.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Guest uploads</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {uploadsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="button"
                disabled={selectedStatus === detail.event.status}
                onClick={() => setDialogKind('change-status')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Calendar className="h-4 w-4" />
                Apply Status
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {uploadsEnabled ? (
                <button
                  type="button"
                  onClick={() => setDialogKind('disable-uploads')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300"
                >
                  <Ban className="h-4 w-4" />
                  Disable Uploads
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDialogKind('enable-uploads')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Enable Uploads
                </button>
              )}

              <div className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                <Upload className="h-4 w-4 text-violet-600" />
                Existing uploads remain visible either way.
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lucky Draw</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Feature enabled</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.luckyDraw.enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Config status</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.luckyDraw.status || 'Not configured'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Total entries</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.luckyDraw.total_entries}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Total winners</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.luckyDraw.total_winners}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Last draw</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(detail.luckyDraw.last_draw_at)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Photo Challenge</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Enabled</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.photoChallenge.enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Goal</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.photoChallenge.goal_photos ?? 'Not configured'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Participants</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.photoChallenge.participant_count}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Goal reached</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.photoChallenge.goal_reached_count}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Claims</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.photoChallenge.claimed_count}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Moderation</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Pending photos</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.moderation.pending_photos}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Rejected photos</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.moderation.rejected_photos}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Review scans</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.moderation.review_scans}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Rejected scans</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.moderation.rejected_scans}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Last moderated</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(detail.moderation.last_moderated_at)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Flags</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {featureFlags.map(({ label, enabled }) => (
                <span
                  key={label}
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    enabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {label}: {enabled ? 'on' : 'off'}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Timeline</h2>
            <div className="mt-4 space-y-3">
              {detail.recentAudit.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No admin audit entries for this event yet.</p>
              ) : (
                detail.recentAudit.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.admin_name || item.admin_email || 'Unknown admin'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.created_at)}</span>
                    </div>
                    {item.reason ? (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.reason}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
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
    </div>
  );
}
