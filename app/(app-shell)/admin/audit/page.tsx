// ============================================
// Galeria - Admin Audit Logs Page
// ============================================
// Super admin interface for viewing audit logs

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Building2,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

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

const getActionColor = (action: string) => {
  if (action.includes('deleted')) return 'text-red-600 dark:text-red-400';
  if (action.includes('created') || action.includes('activated')) return 'text-emerald-600 dark:text-emerald-400';
  if (action.includes('suspended')) return 'text-orange-600 dark:text-orange-400';
  if (action.includes('changed') || action.includes('updated')) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, targetTypeFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (targetTypeFilter !== 'all') {
        params.append('targetType', targetTypeFilter);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }

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
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return actionLabels[action] || action.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    if (action.includes('deleted')) return '🗑️';
    if (action.includes('created')) return '✨';
    if (action.includes('suspended')) return '⏸️';
    if (action.includes('activated')) return '▶️';
    if (action.includes('changed') || action.includes('updated')) return '✏️';
    if (action.includes('mfa')) return '🔐';
    return '📋';
  };

  // Get unique actions and target types from logs for filters
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
  const uniqueTargetTypes = Array.from(new Set(logs.map(l => l.target_type).filter((t): t is string => Boolean(t))));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all admin actions across the platform
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Actions</option>
          {uniqueActions.slice(0, 20).map(action => (
            <option key={action} value={action}>{formatAction(action)}</option>
          ))}
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => {
            setTargetTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All Target Types</option>
          {uniqueTargetTypes.map(type => (
            <option key={type} value={type}>{targetTypeLabels[type] || type}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
            placeholder="From"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
            placeholder="To"
          />
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <FileText className="mb-2 h-12 w-12 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-violet-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.admin_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{log.admin_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getActionIcon(log.action)}</span>
                          <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                            {formatAction(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.target_type && (
                          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                            {targetTypeLabels[log.target_type] || log.target_type}
                            {log.target_id && <span className="text-xs opacity-60">({log.target_id.slice(0, 8)}...)</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.reason && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            "{log.reason}"
                          </p>
                        )}
                        {log.ip_address && (
                          <p className="mt-1 text-xs text-gray-400">
                            From {log.ip_address}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getActionIcon(log.action)}</span>
                      <span className={`font-medium ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimestamp(log.created_at)}</span>
                  </div>

                  <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-violet-500" />
                      <span>{log.admin_name || 'Unknown'}</span>
                    </div>
                  </div>

                  {log.target_type && (
                    <div className="mb-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Target: </span>
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                        {targetTypeLabels[log.target_type] || log.target_type}
                      </span>
                    </div>
                  )}

                  {log.reason && (
                    <div className="rounded-lg bg-gray-50 p-2 text-sm italic text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                      "{log.reason}"
                    </div>
                  )}

                  {log.ip_address && (
                    <div className="mt-2 text-xs text-gray-400">
                      From {log.ip_address}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
