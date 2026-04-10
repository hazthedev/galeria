'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
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

const statusTone: Record<AdminIncidentStatus, string> = {
  healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Incidents
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Platform health and active risk signals
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

        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error || 'Unable to load incidents workspace'}</p>
          <button
            onClick={() => void fetchIncidents()}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Incidents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live operational health for the platform control plane.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => void fetchIncidents()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Critical Services</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.critical_services}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Warnings</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.warning_services}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Moderation</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.pending_moderation}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Events</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.active_events}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Admin MFA Gaps</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.admin_mfa_gaps}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Failed Scans (24h)</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.failed_scans_24h}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Failed Admin Actions (24h)</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {data.summary.failed_admin_actions_24h}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Status</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[...data.services].sort(compareServiceSeverity).map((service: AdminIncidentServiceStatus) => {
            const Icon = getStatusIcon(service.status);

            return (
              <div
                key={service.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${statusTone[service.status]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{service.label}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[service.status]}`}>
                          {formatStatusLabel(service.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{service.summary}</p>
                    </div>
                  </div>
                  {service.latency_ms !== null ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {service.latency_ms}ms
                    </span>
                  ) : null}
                </div>

                {service.details ? (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{service.details}</p>
                ) : null}

                {service.href ? (
                  <div className="mt-3">
                    <Link
                      href={service.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                      Open workspace
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Failures</h2>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              Audit Logs
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {data.recentFailures.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No recent platform failure signals in the last 24 hours.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.recentFailures.map((failure) => (
                <div
                  key={failure.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{failure.title}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {failure.description || 'No extra context recorded.'}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {failure.type === 'scan_failure' ? 'Scan' : 'Admin'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFailureTime(failure.created_at)}
                    </span>
                    {failure.href ? (
                      <Link
                        href={failure.href}
                        className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
