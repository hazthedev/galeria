'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import type { AdminTenantDetailData, AdminTenantStatus } from '@/lib/domain/admin/types';

type DialogKind = 'suspend' | 'activate' | 'change-tier' | 'delete';

const tierLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
  tester: 'Tester',
};

const statusColors: Record<AdminTenantStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const dialogLabels: Record<DialogKind, string> = {
  suspend: 'Suspend tenant',
  activate: 'Activate tenant',
  'change-tier': 'Change plan',
  delete: 'Delete tenant',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Never';
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function getActionSuccessMessage(dialogKind: Exclude<DialogKind, 'delete'>) {
  switch (dialogKind) {
    case 'suspend':
      return 'Tenant suspended';
    case 'activate':
      return 'Tenant activated';
    case 'change-tier':
      return 'Tenant plan updated';
    default:
      return 'Tenant updated';
  }
}

export default function AdminTenantDetailPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params?.tenantId;
  const [detail, setDetail] = useState<AdminTenantDetailData | null>(null);
  const [adminMfaEnabled, setAdminMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [selectedTier, setSelectedTier] = useState('free');
  const [dialogKind, setDialogKind] = useState<DialogKind | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  const isSystemTenant = tenantId === SYSTEM_TENANT_ID;
  const requiresStepUp = adminMfaEnabled && dialogKind === 'suspend';

  const fetchDetail = async () => {
    if (!tenantId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load tenant');
      }

      setDetail(payload.data);
      setSelectedTier(payload.data.tenant.subscription_tier);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load tenant');
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [tenantId]);

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
        // Keep the page usable even if the hint request fails.
      }
    };

    void fetchAdminMfaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const dialogConfig = useMemo(() => {
    if (!detail || !dialogKind) {
      return null;
    }

    const requiresReason = dialogKind === 'suspend' || dialogKind === 'change-tier';

    return {
      title: dialogLabels[dialogKind],
      description:
        (
          <div className="space-y-4">
            <p>
              {dialogKind === 'delete'
                ? `Delete ${detail.tenant.company_name}? This removes ${detail.tenant.user_count} users, ${detail.tenant.event_count} events, and ${detail.tenant.photo_count} photos.`
                : dialogKind === 'change-tier'
                  ? `Change ${detail.tenant.company_name} to ${tierLabels[selectedTier] || selectedTier}?`
                  : `${dialogLabels[dialogKind]} for ${detail.tenant.company_name}?`}
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
                  Required because suspending a tenant affects access across the account.
                </span>
              </label>
            ) : null}
          </div>
        ),
      confirmLabel: dialogLabels[dialogKind],
      variant:
        dialogKind === 'delete'
          ? ('danger' as const)
          : dialogKind === 'suspend'
            ? ('warning' as const)
            : ('primary' as const),
      confirmDisabled:
        (requiresReason && actionReason.trim().length === 0) ||
        (dialogKind === 'change-tier' && selectedTier === detail.tenant.subscription_tier) ||
        (requiresStepUp && !/^\d{6}$/.test(stepUpToken)),
    };
  }, [actionReason, detail, dialogKind, requiresStepUp, selectedTier, stepUpToken]);

  const handleConfirmedAction = async () => {
    if (!detail || !tenantId || !dialogKind) {
      return;
    }

    setIsActionPending(true);

    try {
      if (dialogKind === 'delete') {
        const response = await fetch(`/api/admin/tenants/${tenantId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to delete tenant');
        }

        toast.success(`Deleted tenant: ${detail.tenant.company_name}`);
        window.location.assign('/admin/tenants');
        return;
      }

      const response = await fetch(`/api/admin/tenants/${tenantId}/actions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:
            dialogKind === 'suspend'
              ? 'suspend_tenant'
              : dialogKind === 'activate'
                ? 'activate_tenant'
                : 'change_tier',
          reason: actionReason.trim() || undefined,
          metadata:
            dialogKind === 'change-tier'
              ? { subscription_tier: selectedTier }
              : requiresStepUp
                ? { step_up_token: stepUpToken.trim() }
                : undefined,
        }),
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
        throw new Error(payload.error || 'Failed to update tenant');
      }

      toast.success(getActionSuccessMessage(dialogKind));
      setActionReason('');
      setStepUpToken('');
      setDialogKind(null);
      await fetchDetail();
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update tenant');
    } finally {
      setIsActionPending(false);
    }
  };

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
          href="/admin/tenants"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tenants
        </Link>

        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error || 'Tenant not found'}</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Tenants
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {detail.tenant.company_name}
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[detail.tenant.status]}`}
            >
              {detail.tenant.status}
            </span>
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {tierLabels[detail.tenant.subscription_tier] || detail.tenant.subscription_tier}
            </span>
          </div>

          <p className="mt-1 text-gray-600 dark:text-gray-400">
            <span className="font-mono text-sm">{detail.tenant.slug}</span>
            {' | '}
            Created {formatDate(detail.tenant.created_at)}
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
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Events</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.tenant.event_count}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.tenant.active_events_count} active
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Users</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.tenant.user_count}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.tenant.organizer_count} organizers
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Photos</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.tenant.photo_count}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.tenant.pending_photos_count} pending
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Guests</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {detail.tenant.guest_count}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Across all events</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Summary</h2>
            <div className="mt-4 grid gap-4 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Brand Name
                </p>
                <p className="mt-1">{detail.tenant.brand_name || detail.tenant.company_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Contact Email
                </p>
                <p className="mt-1">{detail.tenant.contact_email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Support Email
                </p>
                <p className="mt-1">{detail.tenant.support_email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Domain
                </p>
                <p className="mt-1">{detail.tenant.domain || detail.tenant.subdomain || 'Not configured'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h2>
              <Link
                href={`/admin/users?search=${encodeURIComponent(detail.tenant.company_name)}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                Open Users
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {detail.recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tenant users yet.</p>
              ) : (
                detail.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name || user.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {user.role}
                      </span>
                      {user.totp_enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <Shield className="h-3 w-3" />
                          MFA
                        </span>
                      ) : null}
                      <span className="text-gray-500 dark:text-gray-400">
                        Last login: {formatDate(user.last_login_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Events</h2>
              <Link
                href={`/admin/events?search=${encodeURIComponent(detail.tenant.company_name)}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                Open Events
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {detail.recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No events created yet.</p>
              ) : (
                detail.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{event.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.short_code ? `/${event.short_code}` : 'No short code'}
                        {' | '}
                        Created {formatDate(event.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {event.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {event.photo_count} photos
                      </span>
                      <Link
                        href={`/admin/events?search=${encodeURIComponent(event.short_code || event.name)}`}
                        className="inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
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

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {detail.tenant.status === 'active' ? (
                  <button
                    type="button"
                    disabled={isSystemTenant}
                    onClick={() => setDialogKind('suspend')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" />
                    Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSystemTenant}
                    onClick={() => setDialogKind('activate')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Activate
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSystemTenant}
                  onClick={() => setDialogKind('delete')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedTier}
                  disabled={isSystemTenant}
                  onChange={(event) => setSelectedTier(event.target.value)}
                  className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="tester">Tester</option>
                </select>

                <button
                  type="button"
                  disabled={isSystemTenant || selectedTier === detail.tenant.subscription_tier}
                  onClick={() => setDialogKind('change-tier')}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Plan
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Features & Limits</h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Features
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(detail.tenant.features_enabled || {}).length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No feature overrides stored.
                    </span>
                  ) : (
                    Object.entries(detail.tenant.features_enabled || {}).map(([key, enabled]) => (
                      <span
                        key={key}
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          enabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {formatLabel(key)}: {enabled ? 'on' : 'off'}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Limits
                </p>
                <div className="mt-2 space-y-2">
                  {Object.entries(detail.tenant.limits || {}).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No limits stored.</p>
                  ) : (
                    Object.entries(detail.tenant.limits || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
                      >
                        <span>{formatLabel(key)}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Timeline</h2>

            <div className="mt-4 space-y-3">
              {detail.recentAudit.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tenant-specific audit activity yet.
                </p>
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
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.created_at)}
                      </span>
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
