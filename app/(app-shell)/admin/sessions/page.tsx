// ============================================
// Galeria - Admin Sessions Management Page
// ============================================
// Super admin interface for viewing and managing user sessions

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Smartphone,
  Globe,
  Clock,
  RefreshCw,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, useConfirmDialog } from '@/components/admin/ConfirmDialog';

interface SessionData {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  name: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  rememberMe: boolean;
  ttl: number;
  isCurrent: boolean;
  deviceInfo: string;
}

interface SessionsResponse {
  data: SessionData[];
  grouped: Record<string, SessionData[]>;
  total: number;
  uniqueUsers: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const confirm = useConfirmDialog();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        toast.error('Failed to load sessions');
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setIsRefreshing(false);
  };

  const handleTerminateSession = (session: SessionData) => {
    confirm.show({
      title: 'Terminate Session',
      description: (
        <>
          Are you sure you want to terminate the session for{' '}
          <strong>{session.name}</strong> ({session.email})?
          <br />
          <span className="text-xs text-gray-500">
            This will log them out from {session.deviceInfo}.
          </span>
        </>
      ),
      confirmLabel: 'Terminate',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        const response = await fetch('/api/admin/sessions', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to terminate session');
        }

        const data = await response.json();
        toast.success(`Terminated ${data.terminatedCount} session(s)`);
        fetchSessions();
      },
    });
  };

  const handleTerminateUserSessions = (userId: string) => {
    const userSessions = sessions?.grouped[userId];
    const user = userSessions?.[0];

    if (!user) return;

    confirm.show({
      title: 'Terminate All User Sessions',
      description: (
        <>
          Are you sure you want to terminate all sessions for this user?
          <br />
          <span className="text-xs text-gray-500">
            Your current session will be preserved.
          </span>
        </>
      ),
      confirmLabel: 'Terminate',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        const response = await fetch('/api/admin/sessions', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, allExceptCurrent: true }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to terminate sessions');
        }

        const data = await response.json();
        toast.success(`Terminated ${data.terminatedCount} session(s)`);
        fetchSessions();
      },
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatTTL = (ttl: number) => {
    if (ttl < 0) return 'Expired';

    const days = Math.floor(ttl / 86400);
    const hours = Math.floor((ttl % 86400) / 3600);
    const minutes = Math.floor((ttl % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getDeviceIcon = (userAgent: string | undefined) => {
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return Smartphone;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Active Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sessions ? `${sessions.total} active sessions across ${sessions.uniqueUsers} users` : 'Manage user sessions'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Sessions List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          </div>
        ) : !sessions || sessions.total === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Monitor className="mb-2 h-12 w-12 opacity-50" />
            <p>No active sessions found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Last Activity</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.data.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.userAgent);
                    return (
                      <tr
                        key={session.sessionId}
                        className={`border-b border-gray-200 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${session.isCurrent ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold dark:bg-violet-900 dark:text-violet-300">
                              {session.name[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {session.name}
                                {session.isCurrent && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{session.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <DeviceIcon className="h-4 w-4" />
                            <span>{session.deviceInfo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {session.ipAddress || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <p>{formatTimestamp(session.lastActivity)}</p>
                            <p className="text-xs text-gray-400">
                              {formatDuration(Date.now() - session.lastActivity)} ago
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            session.ttl < 3600
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {formatTTL(session.ttl)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!session.isCurrent && (
                            <button
                              onClick={() => handleTerminateSession(session)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Terminate session"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {sessions.data.map((session) => {
                const DeviceIcon = getDeviceIcon(session.userAgent);
                const userSessions = sessions.grouped[session.userId];
                const hasMultipleSessions = userSessions && userSessions.length > 1;

                return (
                  <div
                    key={session.sessionId}
                    className={`rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${session.isCurrent ? 'border-violet-200 dark:border-violet-800' : 'border-gray-200'}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <DeviceIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.name}
                          </p>
                          <p className="text-sm text-gray-500">{session.email}</p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleTerminateSession(session)}
                          className="text-red-600 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <LogOut className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>{session.deviceInfo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{session.ipAddress || 'Unknown IP'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(session.lastActivity)}</span>
                      </div>
                    </div>

                    {session.isCurrent && (
                      <div className="mt-3 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        Current Session
                      </div>
                    )}

                    {hasMultipleSessions && !session.isCurrent && (
                      <button
                        onClick={() => handleTerminateUserSessions(session.userId)}
                        className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        Terminate All User Sessions
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Terminate Confirmation Dialog */}
      <ConfirmDialog {...confirm.dialog} />
    </div>
  );
}
