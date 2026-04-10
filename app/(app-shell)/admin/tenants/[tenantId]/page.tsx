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
  RefreshCw,
  Shield,
  Trash2,
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

const statusTones: Record<AdminTenantStatus, 'mint' | 'signal' | 'default'> = {
  active: 'mint',
  suspended: 'signal',
  trialing: 'default',
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
  if (dialogKind === 'suspend') return 'Tenant suspended';
  if (dialogKind === 'activate') return 'Tenant activated';
  return 'Tenant plan updated';
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
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load tenant');
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
    const requiresReason = dialogKind === 'suspend' || dialogKind === 'change-tier';
    return {
      title: dialogLabels[dialogKind],
      description: (
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
      confirmLabel: dialogLabels[dialogKind],
      variant: dialogKind === 'delete' ? ('danger' as const) : dialogKind === 'suspend' ? ('warning' as const) : ('primary' as const),
      confirmDisabled:
        (requiresReason && actionReason.trim().length === 0) ||
        (dialogKind === 'change-tier' && selectedTier === detail.tenant.subscription_tier) ||
        (requiresStepUp && !/^\d{6}$/.test(stepUpToken)),
    };
  }, [actionReason, detail, dialogKind, requiresStepUp, selectedTier, stepUpToken]);

  const handleConfirmedAction = async () => {
    if (!detail || !tenantId || !dialogKind) return;
    setIsActionPending(true);
    try {
      if (dialogKind === 'delete') {
        const response = await fetch(`/api/admin/tenants/${tenantId}`, { method: 'DELETE', credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Failed to delete tenant');
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

  if (isLoading) return <AdminLoadingState label="Loading tenant workspace" />;

  if (error || !detail) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Tenant 360"
          title="Tenant not available"
          description="The requested tenant record could not be loaded."
          actions={<AdminActionButton href="/admin/tenants"><ChevronLeft className="h-4 w-4" />Back to tenants</AdminActionButton>}
        />
        <AdminPanel className="admin-reveal admin-reveal-delay-1">
          <AdminEmptyState icon={AlertCircle} title="Tenant not found" description={error || 'Tenant not found.'} action={<AdminActionButton onClick={() => void fetchDetail()}><RefreshCw className="h-4 w-4" />Retry</AdminActionButton>} />
        </AdminPanel>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Tenant 360"
        title={detail.tenant.company_name}
        description="A support-first view of account health, usage volume, feature limits, and the privileged actions that change tenant state."
        actions={
          <>
            <AdminActionButton onClick={() => void fetchDetail()}><RefreshCw className="h-4 w-4" />Refresh</AdminActionButton>
            <AdminActionButton href="/admin/tenants"><ChevronLeft className="h-4 w-4" />Back to tenants</AdminActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Events" value={detail.tenant.event_count} detail={`${detail.tenant.active_events_count} active`} icon={CheckCircle2} tone="mint" />
        <AdminStatCard label="Users" value={detail.tenant.user_count} detail={`${detail.tenant.organizer_count} organizers`} icon={Shield} />
        <AdminStatCard label="Photos" value={detail.tenant.photo_count} detail={`${detail.tenant.pending_photos_count} pending`} icon={Trash2} />
        <AdminStatCard label="Guests" value={detail.tenant.guest_count} detail="Across all events" icon={ExternalLink} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <AdminPanel title="Account Summary" description="Core tenant profile and operating state.">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Brand Name</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.tenant.brand_name || detail.tenant.company_name}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Contact Email</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.tenant.contact_email || 'Not set'}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Support Email</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.tenant.support_email || 'Not set'}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Domain</p>
                <p className="mt-2 text-[var(--admin-text)]">{detail.tenant.domain || detail.tenant.subdomain || 'Not configured'}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Slug</p>
                <p className="mt-2 font-mono text-xs text-[var(--admin-text)]">{detail.tenant.slug}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Created</p>
                <p className="mt-2 text-[var(--admin-text)]">{formatDate(detail.tenant.created_at)}</p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Recent Users" description="Newest people inside this tenant account.">
            {detail.recentUsers.length === 0 ? (
              <AdminEmptyState icon={Shield} title="No tenant users" description="No users have been added to this tenant yet." />
            ) : (
              <div className="space-y-3">
                {detail.recentUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">{user.name || user.email}</p>
                      <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone={user.role === 'organizer' ? 'mint' : user.role === 'super_admin' ? 'signal' : 'default'}>
                        {user.role}
                      </span>
                      {user.totp_enabled ? <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="mint">MFA</span> : null}
                      <span className="text-[var(--admin-text-muted)]">Last login: {formatDate(user.last_login_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel title="Recent Events" description="The newest event workspaces inside this tenant.">
            {detail.recentEvents.length === 0 ? (
              <AdminEmptyState icon={ExternalLink} title="No events created" description="This tenant has not created any events yet." />
            ) : (
              <div className="space-y-3">
                {detail.recentEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">{event.name}</p>
                      <p className="mt-1 text-sm text-[var(--admin-text-soft)]">
                        {event.short_code ? `/${event.short_code}` : 'No short code'} | Created {formatDate(event.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone={event.status === 'active' ? 'mint' : 'default'}>
                        {event.status}
                      </span>
                      <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{event.photo_count} photos</span>
                      <Link href={`/admin/events?search=${encodeURIComponent(event.short_code || event.name)}`} className="inline-flex items-center gap-1 font-semibold text-[var(--admin-signal)] hover:text-[#ddceff]">
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Support Actions" description="Privileged tenant-level controls.">
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
              <div className="grid gap-2 sm:grid-cols-2">
                {detail.tenant.status === 'active' ? (
                  <AdminActionButton disabled={isSystemTenant} onClick={() => setDialogKind('suspend')}>
                    <Ban className="h-4 w-4" />
                    Suspend
                  </AdminActionButton>
                ) : (
                  <AdminActionButton disabled={isSystemTenant} onClick={() => setDialogKind('activate')} variant="primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Activate
                  </AdminActionButton>
                )}

                <AdminActionButton
                  disabled={isSystemTenant}
                  onClick={() => setDialogKind('delete')}
                  className="border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </AdminActionButton>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select value={selectedTier} disabled={isSystemTenant} onChange={(event) => setSelectedTier(event.target.value)} className={`${adminSelectClassName} flex-1`}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="tester">Tester</option>
                </select>
                <AdminActionButton disabled={isSystemTenant || selectedTier === detail.tenant.subscription_tier} onClick={() => setDialogKind('change-tier')} variant="primary">
                  Apply Plan
                </AdminActionButton>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Features & Limits" description="Stored overrides and numerical constraints for this tenant.">
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Features</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(detail.tenant.features_enabled || {}).length === 0 ? (
                    <span className="text-[var(--admin-text-soft)]">No feature overrides stored.</span>
                  ) : (
                    Object.entries(detail.tenant.features_enabled || {}).map(([key, enabled]) => (
                      <span key={key} className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone={enabled ? 'mint' : 'default'}>
                        {formatLabel(key)}: {enabled ? 'on' : 'off'}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Limits</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(detail.tenant.limits || {}).length === 0 ? (
                    <p className="text-[var(--admin-text-soft)]">No limits stored.</p>
                  ) : (
                    Object.entries(detail.tenant.limits || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                        <span className="text-[var(--admin-text-soft)]">{formatLabel(key)}</span>
                        <span className="font-semibold text-[var(--admin-text)]">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Audit Timeline" description="Recent admin actions affecting this tenant.">
            {detail.recentAudit.length === 0 ? (
              <AdminEmptyState icon={AlertCircle} title="No audit activity" description="No tenant-specific audit activity yet." />
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
