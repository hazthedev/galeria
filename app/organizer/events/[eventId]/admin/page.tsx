// ============================================
// MOMENTIQUE - Event Admin Dashboard Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  QrCode,
  Users,
  Image as ImageIcon,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { EventStats } from '@/components/events/event-stats';
import QRCodeDisplay from '@/components/events/qr-code-display';
import { LuckyDrawAdminTab } from '@/components/lucky-draw/admin/LuckyDrawAdminTab';
import type { IEvent } from '@/lib/types';

export default function EventAdminPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'qr' | 'lucky_draw' | 'settings' | 'moderation'>('overview');

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

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: ImageIcon },
    { id: 'lucky_draw' as const, label: 'Lucky Draw', icon: Sparkles },
    { id: 'qr' as const, label: 'QR Code', icon: QrCode },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'moderation' as const, label: 'Moderation', icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organizer/events/${eventId}`}
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {event.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Admin Dashboard</p>
            </div>
            <Link
              href={`/organizer/events/${eventId}/edit`}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Event
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-8 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {activeTab === 'lucky_draw' && (
            <div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Lucky Draw Management
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Configure prize tiers, view entries, execute draws, and announce winners
              </p>
              <LuckyDrawAdminTab eventId={eventId} />
            </div>
          )}

          {activeTab === 'overview' && (
            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Event Overview
              </h2>
              <EventStats eventId={eventId} refreshInterval={30000} />
            </div>
          )}

          {activeTab === 'qr' && (
            <div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
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
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                    <input
                      type="text"
                      readOnly
                      value={shortLink}
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shortLink);
                      }}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Event Settings
              </h2>
              <div className="space-y-6">
                {/* Event Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Type
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {event.event_type}
                  </p>
                </div>

                {/* Event Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </h3>
                  <span className={clsx(
                    'mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                    {
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': event.status === 'draft',
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': event.status === 'active',
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': event.status === 'ended',
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': event.status === 'archived',
                    }
                  )}>
                    {event.status}
                  </span>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Enabled Features
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem
                      enabled={event.settings?.features?.photo_upload_enabled ?? true}
                      label="Photo Upload"
                    />
                    <FeatureItem
                      enabled={event.settings?.features?.lucky_draw_enabled ?? true}
                      label="Lucky Draw"
                    />
                    <FeatureItem
                      enabled={event.settings?.features?.reactions_enabled ?? true}
                      label="Photo Reactions"
                    />
                    <FeatureItem
                      enabled={event.settings?.features?.moderation_required ?? false}
                      label="Photo Moderation"
                    />
                    <FeatureItem
                      enabled={event.settings?.features?.anonymous_allowed ?? true}
                      label="Anonymous Uploads"
                    />
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Upload Limits
                  </h3>
                  <div className="space-y-2 text-sm">
                    <LimitRow
                      label="Max photos per user"
                      value={event.settings?.limits?.max_photos_per_user ?? 5}
                    />
                    <LimitRow
                      label="Max total photos"
                      value={event.settings?.limits?.max_total_photos ?? 50}
                    />
                    <LimitRow
                      label="Max draw entries"
                      value={event.settings?.limits?.max_draw_entries ?? 30}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/organizer/events/${eventId}/edit`}
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-pink-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Settings
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Photo Moderation
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Review and approve or reject pending photo uploads
              </p>

              <Link
                href={`/organizer/events/${eventId}/photos?status=pending`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                View Pending Photos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span
        className={clsx(
          'rounded-full px-2.5 py-1 text-xs font-medium',
          enabled
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        )}
      >
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
