'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminUserDetailData, AdminUserRole } from '@/lib/domain/admin/types';

type DialogKind =
  | 'change-role'
  | 'change-tier'
  | 'delete-user'
  | 'revoke-session'
  | 'revoke-all-sessions'
  | 'disable-mfa'
  | 'send-password-reset'
  | 'start-impersonation';

const roleLabels: Record<AdminUserRole, string> = {
  guest: 'Guest',
  organizer: 'Organizer',
  super_admin: 'Super Admin',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Never';
}

function formatSessionAge(timestamp: number) {
  const deltaMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(deltaMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }

  if (hours > 0) {
    return `${hours}h ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return 'Just now';
}

function formatTtl(ttl: number) {
  if (ttl < 0) {
    return 'Expired';
  }

  const days = Math.floor(ttl / 86400);
  const hours = Math.floor((ttl % 86400) / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const [detail, setDetail] = useState<AdminUserDetailData | null>(null);
  const [adminMfaEnabled, setAdminMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogKind, setDialogKind] = useState<DialogKind | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>('guest');
  const [selectedTier, setSelectedTier] = useState('free');
  const [isActionPending, setIsActionPending] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const requiresStepUp =
    adminMfaEnabled &&
    (dialogKind === 'delete-user' ||
      dialogKind === 'revoke-all-sessions' ||
      dialogKind === 'disable-mfa');

  const fetchDetail = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load user');
      }

      setDetail(payload.data);
      setSelectedRole(payload.data.user.role);
      setSelectedTier(
        payload.data.user.role === 'super_admin'
          ? payload.data.user.user_subscription_tier || payload.data.user.subscription_tier || 'free'
          : payload.data.user.tenant_subscription_tier || payload.data.user.subscription_tier || 'free'
      );
    } catch (fetchError) {
      setDetail(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [userId]);

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

    return {
      title:
        dialogKind === 'change-role'
          ? 'Change role'
          : dialogKind === 'change-tier'
            ? 'Change plan'
            : dialogKind === 'delete-user'
              ? 'Delete user'
              : dialogKind === 'revoke-session'
                ? 'Revoke session'
                : dialogKind === 'revoke-all-sessions'
                  ? 'Revoke all other sessions'
                  : dialogKind === 'disable-mfa'
                    ? 'Disable MFA'
                    : dialogKind === 'start-impersonation'
                      ? 'Start Support Mode'
                      : 'Send password reset',
      description:
        (
          <div className="space-y-4">
            <p>
              {dialogKind === 'change-role'
                ? `Change ${detail.user.name || detail.user.email} to ${roleLabels[selectedRole]}?`
                : dialogKind === 'change-tier'
                  ? `Change ${detail.user.name || detail.user.email} to ${selectedTier}?`
                  : dialogKind === 'delete-user'
                    ? `Delete ${detail.user.name || detail.user.email}? This cannot be undone.`
                    : dialogKind === 'revoke-session'
                      ? 'Revoke this session immediately? The user will need to sign in again on that device.'
                      : dialogKind === 'revoke-all-sessions'
                        ? `Revoke all other sessions for ${detail.user.name || detail.user.email}? Their current device, if this is their active session, will be preserved.`
                        : dialogKind === 'disable-mfa'
                          ? `Disable MFA for ${detail.user.name || detail.user.email}? They will need to set up their authenticator app again before MFA is restored.`
                          : dialogKind === 'start-impersonation'
                            ? `Start read-only support mode as ${detail.user.name || detail.user.email}? You will leave the admin console until support mode is ended.`
                            : `Send a password reset email to ${detail.user.email}?`}
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
                  Required because this action changes account access or tenant state.
                </span>
              </label>
            ) : null}
          </div>
        ),
      confirmLabel:
        dialogKind === 'change-role'
          ? 'Change role'
          : dialogKind === 'change-tier'
            ? 'Change plan'
            : dialogKind === 'delete-user'
              ? 'Delete user'
              : dialogKind === 'revoke-session'
                ? 'Revoke session'
                : dialogKind === 'revoke-all-sessions'
                  ? 'Revoke sessions'
                  : dialogKind === 'disable-mfa'
                    ? 'Disable MFA'
                    : dialogKind === 'start-impersonation'
                      ? 'Start Support Mode'
                      : 'Send reset email',
      variant:
        dialogKind === 'delete-user'
          ? ('danger' as const)
          : dialogKind === 'revoke-session' ||
              dialogKind === 'revoke-all-sessions' ||
              dialogKind === 'disable-mfa' ||
              dialogKind === 'start-impersonation'
            ? ('warning' as const)
            : ('primary' as const),
      confirmDisabled:
        (dialogKind !== 'start-impersonation' && actionReason.trim().length === 0) ||
        (dialogKind === 'change-role' && selectedRole === detail.user.role) ||
        (dialogKind === 'change-tier' &&
          selectedTier ===
            (detail.user.role === 'super_admin'
              ? detail.user.user_subscription_tier || detail.user.subscription_tier || 'free'
              : detail.user.tenant_subscription_tier || detail.user.subscription_tier || 'free')) ||
        (dialogKind === 'revoke-session' && !selectedSessionId) ||
        (dialogKind === 'disable-mfa' && !detail.user.totp_enabled) ||
        (requiresStepUp && !/^\d{6}$/.test(stepUpToken)) ||
        (dialogKind === 'start-impersonation' && detail.user.role !== 'organizer'),
    };
  }, [
    actionReason,
    detail,
    dialogKind,
    requiresStepUp,
    selectedRole,
    selectedSessionId,
    selectedTier,
    stepUpToken,
  ]);

  const handleConfirmedAction = async () => {
    if (!detail || !dialogKind || !userId) {
      return;
    }

    setIsActionPending(true);

    try {
      const metadata: Record<string, unknown> = {};
      if (dialogKind === 'revoke-session' && selectedSessionId) {
        metadata.session_id = selectedSessionId;
      }
      if (requiresStepUp) {
        metadata.step_up_token = stepUpToken.trim();
      }

      const body =
        dialogKind === 'change-role'
          ? {
              action: 'change_role',
              reason: actionReason.trim(),
              metadata: { role: selectedRole },
            }
          : dialogKind === 'change-tier'
            ? {
                action: 'change_tier',
                reason: actionReason.trim(),
                metadata: { subscription_tier: selectedTier },
              }
            : {
                action:
                  dialogKind === 'delete-user'
                    ? 'delete_user'
                    : dialogKind === 'revoke-session'
                      ? 'revoke_session'
                      : dialogKind === 'revoke-all-sessions'
                        ? 'revoke_all_sessions'
                        : dialogKind === 'disable-mfa'
                          ? 'disable_mfa'
                          : dialogKind === 'start-impersonation'
                            ? 'start_impersonation'
                            : 'send_password_reset',
                reason: actionReason.trim(),
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
              };

      const response =
        dialogKind === 'start-impersonation'
          ? await fetch(`/api/admin/users/${userId}/impersonation`, {
              method: 'POST',
              credentials: 'include',
            })
          : await fetch(`/api/admin/users/${userId}/actions`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
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
        throw new Error(payload.error || 'Failed to update user');
      }

      if (dialogKind === 'delete-user') {
        toast.success('User deleted');
        window.location.assign('/admin/users');
        return;
      }

      if (dialogKind === 'start-impersonation') {
        toast.success('Support mode started');
        window.location.assign(payload.data?.redirectTo || '/organizer');
        return;
      }

      toast.success(
        dialogKind === 'change-role'
          ? 'Role updated'
          : dialogKind === 'change-tier'
            ? 'Plan updated'
            : dialogKind === 'revoke-session'
              ? 'Session revoked'
              : dialogKind === 'revoke-all-sessions'
                ? 'Other sessions revoked'
                : dialogKind === 'disable-mfa'
                  ? 'MFA disabled'
                  : 'Password reset email sent'
      );
      setActionReason('');
      setStepUpToken('');
      setSelectedSessionId(null);
      setDialogKind(null);
      await fetchDetail();
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update user');
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
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error || 'User not found'}</p>
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

  const tenantHref = `/admin/tenants/${detail.user.tenant_id}`;
  const revokableSessions = detail.recentSessions.filter((session) => !session.is_current);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Users
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {detail.user.name || detail.user.email}
            </h1>
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {roleLabels[detail.user.role]}
            </span>
            {detail.user.totp_enabled ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                MFA enabled
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{detail.user.email}</p>
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
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sessions</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{detail.session_count}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail.active_session_count} active</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Joined</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDate(detail.user.created_at)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Account created</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Login</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDate(detail.user.last_login_at)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Latest successful login</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {detail.user.email_verified ? 'Verified' : 'Unverified'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Identity state</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
            <div className="mt-4 grid gap-4 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</p>
                <p className="mt-1">{roleLabels[detail.user.role]}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Effective Plan</p>
                <p className="mt-1">{detail.user.subscription_tier || 'free'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email Verification</p>
                <p className="mt-1">{detail.user.email_verified ? 'Verified' : 'Not verified'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MFA</p>
                <p className="mt-1">{detail.user.totp_enabled ? 'Enabled' : 'Not enabled'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
            <div className="mt-4 space-y-3">
              {detail.recentSessions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions found for this user.</p>
              ) : (
                detail.recentSessions.map((session) => (
                  <div key={session.session_id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {session.device_info}
                          {session.is_current ? (
                            <span className="ml-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.ip_address || 'Unknown IP'} | Last activity {formatSessionAge(session.last_activity)}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        TTL {formatTtl(session.ttl)}
                      </span>
                    </div>
                    {!session.is_current ? (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionId(session.session_id);
                            setDialogKind('revoke-session');
                          }}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300"
                        >
                          <XCircle className="h-4 w-4" />
                          Revoke session
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {detail.user.role === 'organizer' ? 'Related Events' : 'Tenant Events'}
            </h2>
            <div className="mt-4 space-y-3">
              {detail.relatedEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No related events to show.</p>
              ) : (
                detail.relatedEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{event.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.short_code ? `/${event.short_code}` : 'No short code'} | {formatDate(event.event_date || event.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                      View event
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Timeline</h2>
            <div className="mt-4 space-y-3">
              {detail.recentAudit.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No admin audit entries for this user yet.</p>
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

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tenant Context</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Tenant</span>
                <Link href={tenantHref} className="inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                  {detail.user.tenant_name || detail.tenant_slug || detail.user.tenant_id}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Tenant Status</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.tenant_status || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Tenant Slug</span>
                <span className="font-mono text-xs text-gray-900 dark:text-white">{detail.tenant_slug || 'Not available'}</span>
              </div>
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

            <div className="mt-4 grid gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as AdminUserRole)}
                  className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                >
                  <option value="guest">Guest</option>
                  <option value="organizer">Organizer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => setDialogKind('change-role')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  <UserCog className="h-4 w-4" />
                  Change Role
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedTier}
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
                  onClick={() => setDialogKind('change-tier')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  <Shield className="h-4 w-4" />
                  Change Plan
                </button>
              </div>

              <Link
                href={`/admin/sessions`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Open Sessions Workspace
              </Link>

              <button
                type="button"
                disabled={revokableSessions.length === 0}
                onClick={() => {
                  setSelectedSessionId(null);
                  setDialogKind('revoke-all-sessions');
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300"
              >
                <LogOut className="h-4 w-4" />
                Revoke Other Sessions
              </button>

              <button
                type="button"
                disabled={!detail.user.totp_enabled}
                onClick={() => setDialogKind('disable-mfa')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300"
              >
                <Shield className="h-4 w-4" />
                Disable MFA
              </button>

              <button
                type="button"
                onClick={() => setDialogKind('send-password-reset')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
              >
                <XCircle className="h-4 w-4" />
                Send Password Reset
              </button>

              {detail.user.role === 'organizer' ? (
                <button
                  type="button"
                  onClick={() => setDialogKind('start-impersonation')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Start Support Mode
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setDialogKind('delete-user')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>MFA</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.user.totp_enabled ? 'Enabled' : 'Not enabled'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Email</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.user.email_verified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <span>Recent Sessions</span>
                <span className="font-medium text-gray-900 dark:text-white">{detail.session_count}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!dialogConfig}
        onOpenChange={(open) => {
          if (!open) {
            setDialogKind(null);
            setSelectedSessionId(null);
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
