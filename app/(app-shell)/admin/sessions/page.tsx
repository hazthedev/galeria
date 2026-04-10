'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Clock,
  Globe,
  LogOut,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, useConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminSessionsData } from '@/lib/domain/admin/types';
import {
  AdminActionButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/control-plane';

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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSessionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const confirm = useConfirmDialog();

  useEffect(() => {
    void fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.data || null);
      } else {
        toast.error('Failed to load sessions');
      }
    } catch (fetchError) {
      console.error('Failed to fetch sessions:', fetchError);
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
          Are you sure you want to terminate the session for <strong>{session.name}</strong> ({session.email})?
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
          const payload = await response.json();
          throw new Error(payload.error || 'Failed to terminate session');
        }

        const payload = await response.json();
        toast.success(`Terminated ${payload.terminatedCount} session(s)`);
        void fetchSessions();
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
          const payload = await response.json();
          throw new Error(payload.error || 'Failed to terminate sessions');
        }

        const payload = await response.json();
        toast.success(`Terminated ${payload.terminatedCount} session(s)`);
        void fetchSessions();
      },
    });
  };

  const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleString();

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
    <AdminPage>
      <AdminPageHeader
        eyebrow="Access control"
        title="Active Sessions"
        description={
          sessions
            ? `${sessions.total} live sessions across ${sessions.uniqueUsers} users. Current sessions are highlighted so you can terminate access without losing your own bearings.`
            : 'Review active access across the platform and terminate risky sessions when needed.'
        }
        actions={
          <>
            <AdminActionButton onClick={handleRefresh} disabled={isRefreshing || isLoading}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </AdminActionButton>
            <AdminActionButton href="/admin">
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </AdminActionButton>
          </>
        }
      />

      <AdminPanel
        title="Session ledger"
        description="Read recency, device surface, and expiry at a glance before terminating access."
        className="admin-reveal admin-reveal-delay-1"
      >
        {isLoading ? (
          <AdminLoadingState label="Loading sessions" />
        ) : !sessions || sessions.total === 0 ? (
          <AdminEmptyState
            icon={Monitor}
            title="No active sessions"
            description="No session records are currently active."
          />
        ) : (
          <div className="space-y-3">
            {sessions.data.map((session) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              const userSessions = sessions.grouped[session.userId];
              const hasMultipleSessions = userSessions && userSessions.length > 1;

              return (
                <div
                  key={session.sessionId}
                  className={`rounded-[24px] border p-4 transition hover:bg-white/[0.05] ${session.isCurrent ? 'border-[rgba(177,140,255,0.24)] bg-[rgba(177,140,255,0.08)]' : 'border-white/10 bg-white/[0.03]'}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${session.isCurrent ? 'border-[rgba(177,140,255,0.24)] bg-[rgba(177,140,255,0.16)] text-[#decfff]' : 'border-white/10 bg-black/15 text-[var(--admin-text-soft)]'}`}>
                        {session.name[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-semibold text-[var(--admin-text)]">{session.name}</p>
                          {session.isCurrent ? (
                            <span className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" data-tone="signal">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-[var(--admin-text-soft)]">{session.email}</p>
                      </div>
                    </div>

                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-[var(--admin-text-soft)]">
                        <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                          <DeviceIcon className="h-4 w-4" />
                          Device
                        </div>
                        <p className="mt-2 text-[var(--admin-text)]">{session.deviceInfo}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-[var(--admin-text-soft)]">
                        <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                          <Globe className="h-4 w-4" />
                          IP address
                        </div>
                        <p className="mt-2 text-[var(--admin-text)]">{session.ipAddress || 'Unknown'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-[var(--admin-text-soft)]">
                        <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                          <Clock className="h-4 w-4" />
                          Last activity
                        </div>
                        <p className="mt-2 text-[var(--admin-text)]">{formatTimestamp(session.lastActivity)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                          {formatDuration(Date.now() - session.lastActivity)} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span
                        className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                        data-tone={session.ttl < 3600 ? 'signal' : session.ttl < 86400 ? 'default' : 'mint'}
                      >
                        Expires in {formatTTL(session.ttl)}
                      </span>

                      {!session.isCurrent ? (
                        <AdminActionButton onClick={() => handleTerminateSession(session)}>
                          <LogOut className="h-4 w-4" />
                          Terminate
                        </AdminActionButton>
                      ) : null}

                      {hasMultipleSessions && !session.isCurrent ? (
                        <button
                          onClick={() => handleTerminateUserSessions(session.userId)}
                          className="text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#ddceff]"
                        >
                          Terminate all for user
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <ConfirmDialog {...confirm.dialog} />
    </AdminPage>
  );
}
