'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Clock3,
  Gift,
  Image as ImageIcon,
  Shield,
  Trophy,
  Users,
  Waves,
} from 'lucide-react';
import {
  EMPTY_ADMIN_OVERVIEW_STATS,
  type AdminActivityItem,
  type AdminOverviewData,
  type AdminOverviewStats,
} from '@/lib/domain/admin/types';
import {
  AdminActionButton,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from '@/components/admin/control-plane';

const QUICK_ACTIONS = [
  {
    href: '/admin/users',
    title: 'Review identity and roles',
    description: 'Handle support escalations, role edits, and access checks.',
  },
  {
    href: '/admin/moderation',
    title: 'Clear moderation pressure',
    description: 'Move pending uploads toward approval or rejection.',
  },
  {
    href: '/admin/incidents',
    title: 'Watch platform signals',
    description: 'Scan warnings, service health, and failed actions.',
  },
];

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SupervisorDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats>(EMPTY_ADMIN_OVERVIEW_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<AdminActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/admin/overview?activityLimit=10', {
          credentials: 'include',
        });

        if (response.ok) {
          const payload = await response.json();
          const data: AdminOverviewData | undefined = payload.data;
          setStats(data?.stats || EMPTY_ADMIN_OVERVIEW_STATS);
          setRecentActivity(data?.recentActivity || []);
        } else {
          setStats(EMPTY_ADMIN_OVERVIEW_STATS);
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Failed to fetch supervisor overview:', error);
        setStats(EMPTY_ADMIN_OVERVIEW_STATS);
        setRecentActivity([]);
      } finally {
        setIsLoading(false);
        setActivityLoading(false);
      }
    };

    void fetchOverview();
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      detail: 'People currently inside the platform graph.',
      icon: Users,
      href: '/admin/users',
      tone: 'signal' as const,
    },
    {
      label: 'Active Events',
      value: stats.activeEvents.toLocaleString(),
      detail: 'Live galleries that still need operational awareness.',
      icon: Calendar,
      href: '/admin/events',
      tone: 'mint' as const,
    },
    {
      label: 'Pending Photos',
      value: stats.pendingPhotos.toLocaleString(),
      detail: 'Content waiting for moderation decisions right now.',
      icon: Clock3,
      href: '/admin/moderation',
    },
    {
      label: 'Tenants',
      value: stats.totalTenants.toLocaleString(),
      detail: 'Accounts, plans, and status across the whole estate.',
      icon: Building2,
      href: '/admin/tenants',
    },
    {
      label: 'MFA Enabled',
      value: stats.mfaEnabledUsers.toLocaleString(),
      detail: 'Admin and organizer accounts protected with MFA.',
      icon: Shield,
      href: '/admin/incidents',
      tone: 'mint' as const,
    },
    {
      label: 'Lucky Draw Winners',
      value: stats.totalWinners.toLocaleString(),
      detail: 'Prize moments recorded across all tenant campaigns.',
      icon: Trophy,
      href: '/admin/events',
    },
  ];

  const getActivityDetails = (item: AdminActivityItem) => {
    switch (item.type) {
      case 'user':
        return {
          title: 'Identity change',
          detail: `${item.userName || 'Unknown user'}${item.userEmail ? ` · ${item.userEmail}` : ''}`,
          tone: 'signal',
        };
      case 'event':
        return {
          title: 'Event movement',
          detail: `${item.eventName || 'Untitled event'}${item.organizerName ? ` · ${item.organizerName}` : ''}`,
          tone: 'mint',
        };
      case 'photo':
        return {
          title: 'Gallery activity',
          detail: `${item.contributorName || 'Anonymous'}${item.eventName ? ` · ${item.eventName}` : ''}`,
          tone: 'default',
        };
      case 'moderation':
        return {
          title: 'Moderation decision',
          detail: `${item.moderatorName || item.moderatorEmail || 'Moderator'}${item.eventName ? ` · ${item.eventName}` : ''}`,
          tone: 'signal',
        };
      default:
        return {
          title: 'Platform update',
          detail: 'System activity logged',
          tone: 'default',
        };
    }
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading control plane" />;
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Platform command"
        title="Super Admin Dashboard"
        description="A guided view of the platform’s live pressure points: access, content, tenant health, and the signals that need human judgment."
        actions={
          <>
            <AdminActionButton href="/admin/search">Find anything</AdminActionButton>
            <AdminActionButton href="/admin/incidents" variant="primary">
              Review incidents
            </AdminActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className={index > 2 ? 'admin-reveal admin-reveal-delay-2' : 'admin-reveal admin-reveal-delay-1'}
          >
            <AdminStatCard {...card} />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <AdminPanel
          title="Control rhythm"
          description="The fastest sequence for keeping the platform stable and support-ready."
          className="admin-reveal admin-reveal-delay-2"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-[rgba(177,140,255,0.22)] hover:bg-white/[0.05] ${index === 1 ? 'lg:-mt-3' : ''}`}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--admin-text-muted)]">
                  Step 0{index + 1}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-[var(--admin-text)]">{action.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--admin-text-soft)]">
                  {action.description}
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-signal)] transition group-hover:text-[#dacbff]">
                  Enter workspace
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="What to remember"
          description="A small operational compass for this session."
          className="admin-reveal admin-reveal-delay-3"
        >
          <div className="space-y-4">
            <div className="rounded-[22px] border border-[rgba(102,223,212,0.16)] bg-[rgba(102,223,212,0.08)] p-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#9ce7dd]">
                Live volume
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-text)]">
                {stats.totalPhotos.toLocaleString()} photos are currently in the network, with {stats.pendingPhotos.toLocaleString()} waiting on decisions.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--admin-signal-3)]">
                Tenant spread
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">
                {stats.totalEvents.toLocaleString()} events are distributed across {stats.totalTenants.toLocaleString()} tenant workspaces.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--admin-signal)]">
                Prize layer
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">
                {stats.totalLuckyDraws.toLocaleString()} lucky draws and {stats.totalWinners.toLocaleString()} winners are already in circulation.
              </p>
            </div>
          </div>
        </AdminPanel>
      </section>

      <AdminPanel
        title="Recent activity"
        description="The latest human and system actions moving across the platform."
        aside={
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
            <Waves className="h-3.5 w-3.5 text-[var(--admin-signal-2)]" />
            Activity feed
          </div>
        }
        className="admin-reveal admin-reveal-delay-3"
      >
        {activityLoading ? (
          <AdminLoadingState label="Loading activity" />
        ) : recentActivity.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-[var(--admin-text-soft)]">
            No recent activity yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const details = getActivityDetails(item);

              return (
                <div
                  key={item.id}
                  className="group flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05] md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black/20">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt="Activity preview"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="rounded-full bg-[rgba(177,140,255,0.18)] p-2.5 text-[#d8c8ff]">
                          {item.type === 'event' ? (
                            <Calendar className="h-5 w-5" />
                          ) : item.type === 'photo' ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : item.type === 'moderation' ? (
                            <Shield className="h-5 w-5" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[var(--admin-text)]">{details.title}</p>
                        <span
                          className="admin-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                          data-tone={details.tone === 'mint' ? 'mint' : details.tone === 'signal' ? 'signal' : 'default'}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[var(--admin-text-soft)]">{details.detail}</p>
                      {item.reason ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">
                          Reason · {item.reason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="md:ml-auto md:text-right">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
                      Captured
                    </p>
                    <p className="mt-1 text-sm text-[var(--admin-text)]">{formatActivityDate(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </AdminPage>
  );
}
