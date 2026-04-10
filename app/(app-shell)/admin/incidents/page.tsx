'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

import type {
  AdminIncidentsData,
  AdminIncidentServiceStatus,
  AdminIncidentStatus,
} from '@/lib/domain/admin/types';
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from '@/components/admin/control-plane';

const statusTone: Record<AdminIncidentStatus, 'mint' | 'signal' | 'default'> = {
  healthy: 'mint',
  warning: 'default',
  critical: 'signal',
};

function formatStatusLabel(status: AdminIncidentStatus) {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    default:
      return status;
  }
}

function getStatusIcon(status: AdminIncidentStatus) {
  if (status === 'critical') return ShieldAlert;
  if (status === 'warning') return TriangleAlert;
  return CheckCircle2;
}

function compareServiceSeverity(
  left: AdminIncidentServiceStatus,
  right: AdminIncidentServiceStatus
) {
  const rank: Record<AdminIncidentStatus, number> = {
    critical: 0,
    warning: 1,
    healthy: 2,
  };

  return rank[left.status] - rank[right.status];
}

function formatFailureTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminIncidentsPage() {
  const [data, setData] = useState<AdminIncidentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/incidents', {
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load incidents workspace');
      }

      setData(payload.data);
    } catch (fetchError) {
      setData(null);
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to load incidents workspace'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchIncidents();
  }, []);

  if (isLoading) {
    return <AdminLoadingState label="Loading incidents workspace" />;
  }

  if (error || !data) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Platform health"
          title="Incidents"
          description="Operational warnings, service state, and failure signals for the control plane."
          actions={
            <AdminActionButton href="/admin">
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </AdminActionButton>
          }
        />

        <AdminPanel className="admin-reveal admin-reveal-delay-1">
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-[rgba(255,108,122,0.24)] bg-[rgba(255,108,122,0.08)] px-6 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-[#ff9ba4]" />
            <p className="max-w-lg text-sm leading-6 text-[#ffd1d6]">
              {error || 'Unable to load incidents workspace'}
            </p>
            <AdminActionButton onClick={() => void fetchIncidents()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </AdminActionButton>
          </div>
        </AdminPanel>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Platform health"
        title="Incidents"
        description="A live operational board for service condition, moderation pressure, MFA gaps, and failure traces that need escalation."
        actions={
          <>
            <AdminActionButton onClick={() => void fetchIncidents()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </AdminActionButton>
            <AdminActionButton href="/admin">
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </AdminActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Critical Services"
          value={data.summary.critical_services}
          detail="Services currently in a state that blocks or threatens operations."
          icon={ShieldAlert}
          tone="signal"
        />
        <AdminStatCard
          label="Warnings"
          value={data.summary.warning_services}
          detail="Signals that need observation before they become incidents."
          icon={TriangleAlert}
        />
        <AdminStatCard
          label="Pending Moderation"
          value={data.summary.pending_moderation}
          detail="Photos waiting for a human moderation decision."
          icon={AlertCircle}
          href="/admin/moderation"
        />
        <AdminStatCard
          label="Active Events"
          value={data.summary.active_events}
          detail="Live experiences currently generating activity."
          icon={CheckCircle2}
          href="/admin/events"
          tone="mint"
        />
        <AdminStatCard
          label="Admin MFA Gaps"
          value={data.summary.admin_mfa_gaps}
          detail="Accounts that still need stronger protection."
          icon={ShieldAlert}
        />
        <AdminStatCard
          label="Failed Scans 24h"
          value={data.summary.failed_scans_24h}
          detail="Automated scan failures recorded in the last day."
          icon={AlertCircle}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <AdminPanel
          title="Service map"
          description="Each service surface is ranked by severity so the riskiest state appears first."
          className="admin-reveal admin-reveal-delay-2"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {[...data.services].sort(compareServiceSeverity).map((service: AdminIncidentServiceStatus) => {
              const Icon = getStatusIcon(service.status);

              return (
                <div
                  key={service.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/15"
                      >
                        <Icon className="h-5 w-5 text-[var(--admin-text)]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[var(--admin-text)]">{service.label}</h3>
                          <span
                            className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                            data-tone={statusTone[service.status]}
                          >
                            {formatStatusLabel(service.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">{service.summary}</p>
                      </div>
                    </div>
                    {service.latency_ms !== null ? (
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">
                        {service.latency_ms}ms
                      </span>
                    ) : null}
                  </div>

                  {service.details ? (
                    <p className="mt-4 text-sm leading-6 text-[var(--admin-text-muted)]">{service.details}</p>
                  ) : null}

                  {service.href ? (
                    <div className="mt-5">
                      <Link
                        href={service.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
                      >
                        Open workspace
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Recent failures"
          description="The last recorded admin or scan problems in the trailing 24 hours."
          aside={
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
            >
              Audit logs
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
          className="admin-reveal admin-reveal-delay-3"
        >
          {data.recentFailures.length === 0 ? (
            <AdminEmptyState
              icon={CheckCircle2}
              title="No recent failures"
              description="The last 24 hours have not produced platform failure signals."
            />
          ) : (
            <div className="space-y-3">
              {data.recentFailures.map((failure) => (
                <div
                  key={failure.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--admin-text)]">{failure.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">
                        {failure.description || 'No extra context recorded.'}
                      </p>
                    </div>
                    <span
                      className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      data-tone="signal"
                    >
                      {failure.type === 'scan_failure' ? 'Scan' : 'Admin'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">
                      {formatFailureTime(failure.created_at)}
                    </span>
                    {failure.href ? (
                      <Link
                        href={failure.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </section>
    </AdminPage>
  );
}
