'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminSelectClassName,
} from '@/components/admin/control-plane';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  admin_email?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  reason?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const actionLabels: Record<string, string> = {
  'user.created': 'User Created',
  'user.deleted': 'User Deleted',
  'user.role_changed': 'Role Changed',
  'user.tier_changed': 'Plan Changed',
  'user.password_reset': 'Password Reset Sent',
  'user.mfa_disabled': 'User MFA Disabled',
  'user.impersonation_started': 'Support Mode Started',
  'user.impersonation_ended': 'Support Mode Ended',
  'tenant.created': 'Tenant Created',
  'tenant.deleted': 'Tenant Deleted',
  'tenant.suspended': 'Tenant Suspended',
  'tenant.activated': 'Tenant Activated',
  'tenant.plan_changed': 'Plan Changed',
  'tenant.updated': 'Tenant Updated',
  'photo.approved': 'Photo Approved',
  'photo.rejected': 'Photo Rejected',
  'photo.deleted': 'Photo Deleted',
  'admin.mfa_enabled': 'MFA Enabled',
  'admin.mfa_disabled': 'MFA Disabled',
};

const targetTypeLabels: Record<string, string> = {
  user: 'User',
  tenant: 'Tenant',
  event: 'Event',
  photo: 'Photo',
};

const getActionTone = (action: string): 'signal' | 'mint' | 'default' => {
  if (action.includes('deleted') || action.includes('suspended')) return 'signal';
  if (action.includes('created') || action.includes('activated')) return 'mint';
  return 'default';
};

const getActionGlyph = (action: string) => {
  if (action.includes('deleted')) return 'DEL';
  if (action.includes('created')) return 'NEW';
  if (action.includes('suspended')) return 'HOLD';
  if (action.includes('activated')) return 'LIVE';
  if (action.includes('changed') || action.includes('updated')) return 'EDIT';
  if (action.includes('mfa')) return 'MFA';
  return 'LOG';
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    void fetchLogs();
  }, [currentPage, actionFilter, targetTypeFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetTypeFilter !== 'all') params.append('targetType', targetTypeFilter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

      const response = await fetch(`/api/admin/audit?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data: AuditLogsResponse = await response.json();
        setLogs(data.data || []);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error('Failed to load audit logs');
      }
    } catch (fetchError) {
      console.error('Failed to fetch audit logs:', fetchError);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action: string) =>
    actionLabels[action] ||
    action.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueTargetTypes = Array.from(new Set(logs.map((log) => log.target_type).filter((type): type is string => Boolean(type))));

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Decision trace"
        title="Audit Logs"
        description="A readable history of admin actions, who took them, which record they targeted, and the reason that justified the change."
        actions={
          <AdminActionButton href="/admin">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </AdminActionButton>
        }
      />

      <AdminPanel
        title="Audit filters"
        description="Narrow by action type, target class, or date range."
        className="admin-reveal admin-reveal-delay-1"
      >
        <div className="flex flex-col gap-3 xl:flex-row">
          <select
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={adminSelectClassName}
          >
            <option value="all">All Actions</option>
            {uniqueActions.slice(0, 20).map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>

          <select
            value={targetTypeFilter}
            onChange={(event) => {
              setTargetTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={adminSelectClassName}
          >
            <option value="all">All Target Types</option>
            {uniqueTargetTypes.map((type) => (
              <option key={type} value={type}>
                {targetTypeLabels[type] || type}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setCurrentPage(1);
            }}
            className={`${adminSelectClassName} min-w-0`}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setCurrentPage(1);
            }}
            className={`${adminSelectClassName} min-w-0`}
          />
        </div>
      </AdminPanel>

      <AdminPanel
        title="Action stream"
        description="Every record is formatted for quick reasoning instead of raw log skimming."
        className="admin-reveal admin-reveal-delay-2"
      >
        {isLoading ? (
          <AdminLoadingState label="Loading audit stream" />
        ) : logs.length === 0 ? (
          <AdminEmptyState
            icon={FileText}
            title="No audit logs found"
            description="There are no admin audit entries for the selected filters."
          />
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-soft)]"
                      >
                        {getActionGlyph(log.action)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-[var(--admin-text)]">{formatAction(log.action)}</p>
                          <span
                            className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                            data-tone={getActionTone(log.action)}
                          >
                            {log.target_type ? targetTypeLabels[log.target_type] || log.target_type : 'System'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--admin-text-soft)]">
                          <Shield className="h-4 w-4 text-[var(--admin-signal)]" />
                          <span>{log.admin_name || 'Unknown admin'}</span>
                          {log.admin_email ? <span className="text-[var(--admin-text-muted)]">{log.admin_email}</span> : null}
                        </div>
                        {log.reason ? (
                          <p className="mt-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3 text-sm leading-6 text-[var(--admin-text-soft)]">
                            "{log.reason}"
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2 lg:text-right">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">
                        {formatTimestamp(log.created_at)}
                      </p>
                      {log.target_id ? (
                        <p className="text-sm text-[var(--admin-text-soft)]">
                          Target ID {log.target_id.slice(0, 8)}...
                        </p>
                      ) : null}
                      {log.ip_address ? (
                        <p className="text-sm text-[var(--admin-text-muted)]">From {log.ip_address}</p>
                      ) : null}
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
    </AdminPage>
  );
}
