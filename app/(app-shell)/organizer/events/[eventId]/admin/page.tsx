// ============================================
// Galeria - Event Admin Dashboard Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Settings,
  QrCode,
  Users,
  Image as ImageIcon,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { EventStats } from '@/components/events/event-stats';
import QRCodeDisplay from '@/components/events/qr-code-display';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';

const LuckyDrawAdminTab = dynamic(
  () => import('@/components/lucky-draw/admin/LuckyDrawAdminTab').then(mod => ({ default: mod.LuckyDrawAdminTab })),
  { ssr: false }
);
const AttendanceAdminTab = dynamic(
  () => import('@/components/attendance/AttendanceAdminTab').then(mod => ({ default: mod.AttendanceAdminTab })),
  { ssr: false }
);
const PhotoChallengeAdminTab = dynamic(
  () => import('@/components/photo-challenge/admin-tab').then(mod => ({ default: mod.PhotoChallengeAdminTab })),
  { ssr: false }
);
const SettingsAdminTab = dynamic(
  () => import('@/components/settings/SettingsAdminTab').then(mod => ({ default: mod.SettingsAdminTab })),
  { ssr: false }
);
import type { IEvent } from '@/lib/types';
import { useOrganizerEntitlements } from '@/lib/use-organizer-entitlements';
import { OrganizerEventAdminSkeleton } from '@/components/events/page-skeletons';
import { ModerationActivitySkeleton } from '@/components/events/admin-tab-skeletons';

export default function EventAdminPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'qr' | 'lucky_draw' | 'attendance' | 'settings' | 'moderation' | 'photo_challenge'>('overview');
  const [moderationLogs, setModerationLogs] = useState<Array<{
    id: string;
    photoId: string | null;
    action: string;
    source?: string;
    reason: string | null;
    createdAt: string;
    moderatorId?: string | null;
    moderatorName: string | null;
    moderatorEmail: string | null;
    photoStatus: string | null;
    imageUrl: string | null;
  }>>([]);
  const [isModerationLogsLoading, setIsModerationLogsLoading] = useState(false);
  const {
    tier: organizerTier,
    features: organizerFeatures,
    isLoading: entitlementsLoading,
  } = useOrganizerEntitlements();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load event');
        }

        setEvent(data.data);
        setError(null);
      } catch (err) {
        console.error('[EVENT_ADMIN] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const moderationRequired = event?.settings?.features?.moderation_required === true;
    if (activeTab !== 'moderation' || !moderationRequired) {
      setModerationLogs([]);
      setIsModerationLogsLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setIsModerationLogsLoading(true);
      try {
        const response = await fetch(`/api/events/${eventId}/moderation-logs?limit=10`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setModerationLogs(data.data || []);
        }
      } catch (err) {
        console.error('[EVENT_ADMIN] Failed to fetch moderation logs:', err);
      } finally {
        setIsModerationLogsLoading(false);
      }
    };

    void fetchLogs();
  }, [activeTab, eventId, event?.settings?.features?.moderation_required]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: ImageIcon },
    { id: 'lucky_draw' as const, label: 'Lucky Draw', icon: Sparkles },
    { id: 'attendance' as const, label: 'Attendance', icon: Users },
    { id: 'photo_challenge' as const, label: 'Photo Challenge', icon: Target },
    { id: 'qr' as const, label: 'QR Code', icon: QrCode },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'moderation' as const, label: 'Moderation', icon: Shield },
  ];

  const getModerationLabel = (log: (typeof moderationLogs)[number]) => {
    const statusRaw = (log.photoStatus || log.action || '').toLowerCase();
    if (statusRaw === 'approve') return 'Approved';
    if (statusRaw === 'reject') return 'Rejected';
    if (statusRaw === 'review') return 'Needs review';
    if (statusRaw === 'delete') return 'Deleted';
    return statusRaw
      ? `${statusRaw.charAt(0).toUpperCase()}${statusRaw.slice(1)}`
      : 'Updated';
  };

  const getModerationTone = (log: (typeof moderationLogs)[number]) => {
    const statusRaw = (log.photoStatus || log.action || '').toLowerCase();
    if (statusRaw === 'approved' || statusRaw === 'approve') {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200';
    }
    if (statusRaw === 'rejected' || statusRaw === 'reject' || statusRaw === 'delete') {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200';
    }
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200';
  };

  if (isLoading) {
    return <OrganizerEventAdminSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Event not found'}</p>
          <Link
            href={`/organizer/events/${eventId}`}
            className="mt-4 inline-block text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  const shortLink = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.short_code || event.id}`
    : '';
  const luckyDrawEnabled = event.settings?.features?.lucky_draw_enabled !== false;
  const luckyDrawPlanLocked = !entitlementsLoading && organizerFeatures?.lucky_draw === false;
  const reactionsEnabled = event.settings?.features?.reactions_enabled !== false;
  const advancedAnalyticsLocked = !entitlementsLoading && organizerFeatures?.advanced_analytics === false;
  const attendanceEnabled = event.settings?.features?.attendance_enabled !== false;
  const photoChallengeEnabled = event.settings?.features?.photo_challenge_enabled === true;
  const moderationEnabled = event.settings?.features?.moderation_required === true;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:pt-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/organizer/events/${eventId}`}
            className="mb-4 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-offset-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Admin Dashboard</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="-mx-4 mb-6 overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:mx-0">
          <nav className="-mb-px flex gap-1.5 overflow-x-auto px-4 pb-2 pr-6 sm:gap-6 sm:px-0 sm:pr-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2.5 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:gap-2 sm:px-1 sm:py-4 sm:text-sm',
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {tab.label}
                  {tab.id === 'lucky_draw' && luckyDrawPlanLocked && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      Pro+
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:p-8">
          {activeTab === 'lucky_draw' && (
            <SectionErrorBoundary
              title="Lucky draw tools unavailable"
              message="The lucky draw admin tab hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Lucky Draw Management
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Configure prize tiers, view entries, execute draws, and announce winners
              </p>
              {luckyDrawPlanLocked ? (
                <UpgradePrompt
                  variant="inline"
                  title="Upgrade to unlock Lucky Draw"
                  message="Your current plan does not include Lucky Draw. Upgrade to configure entries, create prize tiers, and run draws for this event."
                  currentTier={organizerTier || 'free'}
                  recommendedTier="pro"
                  featureBlocked="Lucky Draw"
                />
              ) : luckyDrawEnabled ? (
                <LuckyDrawAdminTab eventId={eventId} />
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-amber-900 dark:text-amber-100">
                  <p className="text-lg font-semibold">Lucky Draw is disabled</p>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                    Enable Lucky Draw in Event Settings to configure entries and run draws.
                  </p>
                </div>
              )}
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'attendance' && (
            <SectionErrorBoundary
              title="Attendance tools unavailable"
              message="The attendance admin tab hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Attendance Management
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Manage check-ins, view guest lists, generate QR codes, and track attendance data
              </p>

              <AttendanceAdminTab
                eventId={eventId}
                attendanceEnabled={attendanceEnabled}
              />
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'photo_challenge' && (
            <SectionErrorBoundary
              title="Photo challenge tools unavailable"
              message="The photo challenge admin tab hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Photo Challenge Management
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Motivate guests to upload more photos with goals and prizes
              </p>
              {photoChallengeEnabled ? (
                <PhotoChallengeAdminTab eventId={eventId} />
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-amber-900 dark:text-amber-100">
                  <p className="text-lg font-semibold">Photo Challenge is disabled</p>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                    Enable Photo Challenge in Event Settings to create goals and rewards.
                  </p>
                </div>
              )}
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'overview' && (
            <SectionErrorBoundary
              title="Overview unavailable"
              message="The event overview hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Event Overview
              </h2>
              <EventStats
                eventId={eventId}
                refreshInterval={30000}
                allowAdvancedAnalytics={!advancedAnalyticsLocked}
                allowReactions={reactionsEnabled}
                currentTier={organizerTier}
              />
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'qr' && (
            <SectionErrorBoundary
              title="QR tools unavailable"
              message="The event sharing tools hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                QR Code for Event Sharing
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Share this QR code with guests to let them easily upload photos to your event
              </p>
              <QRCodeDisplay
                url={shortLink}
                eventName={event.name}
                size={300}
              />

              {/* Shareable Links */}
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Short Link (Easy to Share)
                  </h3>
                  <div className="flex flex-col gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      readOnly
                      value={shortLink}
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shortLink);
                      }}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 sm:w-auto"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'settings' && (
            <SectionErrorBoundary
              title="Settings unavailable"
              message="The event settings tab hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Event Settings
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Manage event details, theme, features, and security settings
              </p>
              <SettingsAdminTab
                event={event}
                onUpdate={(updatedEvent) => setEvent(updatedEvent)}
                tenantFeatures={organizerFeatures}
                currentTier={organizerTier}
                entitlementsLoading={entitlementsLoading}
              />
              </div>
            </SectionErrorBoundary>
          )}

          {activeTab === 'moderation' && (
            <SectionErrorBoundary
              title="Moderation tools unavailable"
              message="The moderation tab hit a rendering issue. Retry this section to continue."
            >
              <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                Photo Moderation
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Review and approve or reject pending photo uploads
              </p>

              {moderationEnabled ? (
                <>
                  <Link
                    href={`/organizer/events/${eventId}/photos?status=pending`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800 sm:w-auto"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    View Pending Photos
                  </Link>

                  <div className="mt-8">
                    <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recent Moderation Activity
                    </h3>
                    {isModerationLogsLoading ? (
                      <ModerationActivitySkeleton />
                    ) : moderationLogs.length > 0 ? (
                      <div className="space-y-3">
                        {moderationLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex flex-col gap-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
                                {log.imageUrl ? (
                                  <Image
                                    src={log.imageUrl}
                                    alt="Moderated"
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', getModerationTone(log))}>
                                    {getModerationLabel(log)}
                                  </span>
                                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                                    {log.source === 'ai' ? 'AI' : 'Manual'}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                  {log.moderatorName || log.moderatorEmail || 'Moderator'}
                                </p>
                                {log.reason && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {log.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        No recent moderation activity yet.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-amber-900 dark:text-amber-100">
                  <p className="text-lg font-semibold">Photo Moderation is disabled</p>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                    Enable Photo Moderation in Event Settings to review photos before publishing.
                  </p>
                </div>
              )}
              </div>
            </SectionErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
