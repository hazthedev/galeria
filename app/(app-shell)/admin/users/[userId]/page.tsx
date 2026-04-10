'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
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
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function formatTtl(ttl: number) {
  if (ttl < 0) return 'Expired';
  const days = Math.floor(ttl / 86400);
  const hours = Math.floor((ttl % 86400) / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
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
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load user');
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
        const response = await fetch('/api/admin/mfa/status', { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return;
        if (isMounted) setAdminMfaEnabled(Boolean(payload.data?.enabled));
      } catch {}
    };
    void fetchAdminMfaStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const dialogConfig = useMemo(() => {
    if (!detail || !dialogKind) return null;
    const currentTier =
      detail.user.role === 'super_admin'
        ? detail.user.user_subscription_tier || detail.user.subscription_tier || 'free'
        : detail.user.tenant_subscription_tier || detail.user.subscription_tier || 'free';

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
      description: (
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
                      ? `Revoke all other sessions for ${detail.user.name || detail.user.email}?`
                      : dialogKind === 'disable-mfa'
                        ? `Disable MFA for ${detail.user.name || detail.user.email}?`
                        : dialogKind === 'start-impersonation'
                          ? `Start read-only support mode as ${detail.user.name || detail.user.email}?`
                          : `Send a password reset email to ${detail.user.email}?`}
          </p>
          {requiresStepUp ? (
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Current MFA code</span>
              <input
                value={stepUpToken}
                onChange={(event) => setStepUpToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className={`${adminSelectClassName} mt-2 w-full`}
              />
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
        (dialogKind === 'change-tier' && selectedTier === currentTier) ||
        (dialogKind === 'revoke-session' && !selectedSessionId) ||
        (dialogKind === 'disable-mfa' && !detail.user.totp_enabled) ||
        (requiresStepUp && !/^\d{6}$/.test(stepUpToken)) ||
        (dialogKind === 'start-impersonation' && detail.user.role !== 'organizer'),
    };
  }, [actionReason, detail, dialogKind, requiresStepUp, selectedRole, selectedSessionId, selectedTier, stepUpToken]);

  const handleConfirmedAction = async () => {
    if (!detail || !dialogKind || !userId) return;
    setIsActionPending(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (dialogKind === 'revoke-session' && selectedSessionId) metadata.session_id = selectedSessionId;
      if (requiresStepUp) metadata.step_up_token = stepUpToken.trim();

      const body =
        dialogKind === 'change-role'
          ? { action: 'change_role', reason: actionReason.trim(), metadata: { role: selectedRole } }
          : dialogKind === 'change-tier'
            ? { action: 'change_tier', reason: actionReason.trim(), metadata: { subscription_tier: selectedTier } }
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
          ? await fetch(`/api/admin/users/${userId}/impersonation`, { method: 'POST', credentials: 'include' })
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

  if (isLoading) return <AdminLoadingState label="Loading user workspace" />;

  if (error || !detail) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="User 360"
          title="User not available"
          description="The requested user record could not be loaded."
          actions={<AdminActionButton href="/admin/users"><ChevronLeft className="h-4 w-4" />Back to users</AdminActionButton>}
        />
        <AdminPanel className="admin-reveal admin-reveal-delay-1">
          <AdminEmptyState icon={AlertCircle} title="User not found" description={error || 'User not found.'} action={<AdminActionButton onClick={() => void fetchDetail()}><RefreshCw className="h-4 w-4" />Retry</AdminActionButton>} />
        </AdminPanel>
      </AdminPage>
    );
  }

  const tenantHref = `/admin/tenants/${detail.user.tenant_id}`;
  const revokableSessions = detail.recentSessions.filter((session) => !session.is_current);
  const effectiveTier =
    detail.user.role === 'super_admin'
      ? detail.user.user_subscription_tier || detail.user.subscription_tier || 'free'
      : detail.user.tenant_subscription_tier || detail.user.subscription_tier || 'free';

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="User 360"
        title={detail.user.name || detail.user.email}
        description="A support-focused view of identity, tenant context, session exposure, and high-trust actions for this account."
        actions={
          <>
            <AdminActionButton onClick={() => void fetchDetail()}><RefreshCw className="h-4 w-4" />Refresh</AdminActionButton>
            <AdminActionButton href="/admin/users"><ChevronLeft className="h-4 w-4" />Back to users</AdminActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Sessions" value={detail.session_count} detail={`${detail.active_session_count} active`} icon={LogOut} />
        <AdminStatCard label="Joined" value={detail.user.created_at ? new Date(detail.user.created_at).toLocaleDateString() : 'Unknown'} detail="Account created" icon={UserCog} />
        <AdminStatCard label="Last Login" value={detail.user.last_login_at ? new Date(detail.user.last_login_at).toLocaleDateString() : 'Never'} detail="Latest successful login" icon={Shield} />
        <AdminStatCard label="Email State" value={detail.user.email_verified ? 'Verified' : 'Unverified'} detail={detail.user.totp_enabled ? 'MFA enabled' : 'MFA not enabled'} icon={AlertCircle} tone={detail.user.totp_enabled ? 'mint' : 'default'} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <AdminPanel title="Summary" description="Identity, plan, and verification state.">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Role</p>
                <p className="mt-2 text-[var(--admin-text)]">{roleLabels[detail.user.role]}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Effective Plan</p>
                <p className="mt-2 text-[var(--admin-text)]">{effectiveTier}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Email Verification</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.user.email_verified ? 'Verified' : 'Not verified'}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">MFA</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.user.totp_enabled ? 'Enabled' : 'Not enabled'}</p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Recent Sessions" description="Current and recent device access for this account.">
            {detail.recentSessions.length === 0 ? (
              <AdminEmptyState icon={LogOut} title="No active sessions" description="No active sessions found for this user." />
            ) : (
              <div className="space-y-3">
                {detail.recentSessions.map((session) => (
                  <div key={session.session_id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--admin-text)]">{session.device_info}</p>
                          {session.is_current ? (
                            <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="signal">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--admin-text-soft)]">
                          {session.ip_address || 'Unknown IP'} | Last activity {formatSessionAge(session.last_activity)}
                        </p>
                      </div>
                      <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                        TTL {formatTtl(session.ttl)}
                      </span>
                    </div>
                    {!session.is_current ? (
                      <div className="mt-4 flex justify-end">
                        <AdminActionButton onClick={() => { setSelectedSessionId(session.session_id); setDialogKind('revoke-session'); }}>
                          <XCircle className="h-4 w-4" />
                          Revoke session
                        </AdminActionButton>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel title={detail.user.role === 'organizer' ? 'Related Events' : 'Tenant Events'} description="Events most relevant to this user or their tenant.">
            {detail.relatedEvents.length === 0 ? (
              <AdminEmptyState icon={ExternalLink} title="No related events" description="No related events to show." />
            ) : (
              <div className="space-y-3">
                {detail.relatedEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">{event.name}</p>
                      <p className="mt-1 text-sm text-[var(--admin-text-soft)]">
                        {event.short_code ? `/${event.short_code}` : 'No short code'} | {formatDate(event.event_date || event.created_at)}
                      </p>
                    </div>
                    <Link href={`/admin/events/${event.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]">
                      View event
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel title="Audit Timeline" description="Recent admin actions affecting this user.">
            {detail.recentAudit.length === 0 ? (
              <AdminEmptyState icon={AlertCircle} title="No audit entries" description="No admin audit entries for this user yet." />
            ) : (
              <div className="space-y-3">
                {detail.recentAudit.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--admin-text)]">{item.action}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">{item.admin_name || item.admin_email || 'Unknown admin'}</p>
                      </div>
                      <span className="text-xs text-[var(--admin-text-muted)]">{formatDate(item.created_at)}</span>
                    </div>
                    {item.reason ? <p className="mt-3 text-sm text-[var(--admin-text-soft)]">{item.reason}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Tenant Context" description="The account and workspace this user belongs to.">
            <div className="space-y-3 text-sm">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tenant</p>
                <Link href={tenantHref} className="mt-2 inline-flex items-center gap-1 font-semibold text-[var(--admin-signal)] hover:text-[#ddceff]">
                  {detail.user.tenant_name || detail.tenant_slug || detail.user.tenant_id}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tenant Status</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.tenant_status || 'Unknown'}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tenant Slug</p>
                <p className="mt-2 font-mono text-xs text-[var(--admin-text)]">{detail.tenant_slug || 'Not available'}</p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Support Actions" description="Privileged actions for identity, sessions, and support mode.">
            <label className="block">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">Action reason</span>
              <textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={3}
                placeholder="Reason for the next privileged action"
                className={`${adminTextareaClassName} mt-2`}
              />
            </label>

            <div className="mt-4 grid gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as AdminUserRole)} className={`${adminSelectClassName} flex-1`}>
                  <option value="guest">Guest</option>
                  <option value="organizer">Organizer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <AdminActionButton onClick={() => setDialogKind('change-role')} variant="primary">
                  <UserCog className="h-4 w-4" />
                  Change Role
                </AdminActionButton>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select value={selectedTier} onChange={(event) => setSelectedTier(event.target.value)} className={`${adminSelectClassName} flex-1`}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="tester">Tester</option>
                </select>
                <AdminActionButton onClick={() => setDialogKind('change-tier')} variant="primary">
                  <Shield className="h-4 w-4" />
                  Change Plan
                </AdminActionButton>
              </div>

              <AdminActionButton href="/admin/sessions">
                <LogOut className="h-4 w-4" />
                Open Sessions Workspace
              </AdminActionButton>

              <AdminActionButton onClick={() => { setSelectedSessionId(null); setDialogKind('revoke-all-sessions'); }} disabled={revokableSessions.length === 0}>
                <LogOut className="h-4 w-4" />
                Revoke Other Sessions
              </AdminActionButton>

              <AdminActionButton onClick={() => setDialogKind('disable-mfa')} disabled={!detail.user.totp_enabled}>
                <Shield className="h-4 w-4" />
                Disable MFA
              </AdminActionButton>

              <AdminActionButton onClick={() => setDialogKind('send-password-reset')}>
                <XCircle className="h-4 w-4" />
                Send Password Reset
              </AdminActionButton>

              {detail.user.role === 'organizer' ? (
                <AdminActionButton onClick={() => setDialogKind('start-impersonation')}>
                  <ArrowLeftRight className="h-4 w-4" />
                  Start Support Mode
                </AdminActionButton>
              ) : null}

              <AdminActionButton
                onClick={() => setDialogKind('delete-user')}
                className="border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </AdminActionButton>
            </div>
          </AdminPanel>
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
    </AdminPage>
  );
}
