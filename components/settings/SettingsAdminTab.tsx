// ============================================
// Galeria - Settings Admin Tab Component
// ============================================

'use client';

import { useState } from 'react';
import {
  Calendar,
  Palette,
  Sparkles,
  Shield,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import type { EventType, IEvent, ITenantFeatures, SubscriptionTier } from '@/lib/types';
import { DEFAULT_UPLOAD_RATE_LIMITS, THEME_PRESETS } from './constants';
import { useThemePresetSync } from './hooks/useThemePresetSync';
import { findMatchingPresetId } from './utils';
import { AdvancedTab } from './tabs/AdvancedTab';
import { BasicTab } from './tabs/BasicTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { SecurityTab } from './tabs/SecurityTab';
import { ThemeTab } from './tabs/ThemeTab';
import type { SettingsSubTab } from './types';

interface SettingsAdminTabProps {
  event: IEvent;
  onUpdate?: (event: IEvent) => void;
  tenantFeatures?: ITenantFeatures | null;
  currentTier?: SubscriptionTier | null;
  entitlementsLoading?: boolean;
}

export function SettingsAdminTab({
  event,
  onUpdate,
  tenantFeatures,
  currentTier,
  entitlementsLoading = false,
}: SettingsAdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Basic Info state
  const [eventName, setEventName] = useState(event.name);
  const [eventType, setEventType] = useState(event.event_type);
  const [eventDate, setEventDate] = useState(
    new Date(event.event_date).toISOString().split('T')[0]
  );
  const [location, setLocation] = useState(event.location || '');
  const [expectedGuests, setExpectedGuests] = useState(event.expected_guests || 0);
  const [description, setDescription] = useState(event.description || '');
  const [customHashtag, setCustomHashtag] = useState(event.custom_hashtag || '');
  const [shortCode, setShortCode] = useState(event.short_code || '');
  const [eventStatus, setEventStatus] = useState(event.status);

  // Theme state
  const [photoCardStyle, setPhotoCardStyle] = useState(
    event.settings?.theme?.photo_card_style || 'vacation'
  );
  const [primaryColor, setPrimaryColor] = useState(
    event.settings?.theme?.primary_color || '#8B5CF6'
  );
  const [secondaryColor, setSecondaryColor] = useState(
    event.settings?.theme?.secondary_color || '#EC4899'
  );
  const [backgroundColor, setBackgroundColor] = useState(
    event.settings?.theme?.background || '#F9FAFB'
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    const currentPrimary = event.settings?.theme?.primary_color || '#8B5CF6';
    const currentSecondary = event.settings?.theme?.secondary_color || '#EC4899';
    const currentBackground = event.settings?.theme?.background || '#F9FAFB';
    return findMatchingPresetId(THEME_PRESETS, currentPrimary, currentSecondary, currentBackground);
  });

  useThemePresetSync({
    primaryColor,
    secondaryColor,
    backgroundColor,
    presets: THEME_PRESETS,
    onPresetChange: setSelectedPreset,
  });

  // Features state
  const [guestDownloadEnabled, setGuestDownloadEnabled] = useState(
    event.settings?.features?.guest_download_enabled !== false
  );
  const [moderationRequired, setModerationRequired] = useState(
    event.settings?.features?.moderation_required || false
  );
  const [anonymousAllowed, setAnonymousAllowed] = useState(
    event.settings?.features?.anonymous_allowed !== false
  );
  const [luckyDrawEnabled, setLuckyDrawEnabled] = useState(
    event.settings?.features?.lucky_draw_enabled !== false
  );
  const [reactionsEnabled, setReactionsEnabled] = useState(
    event.settings?.features?.reactions_enabled !== false
  );
  const [attendanceEnabled, setAttendanceEnabled] = useState(
    event.settings?.features?.attendance_enabled !== false
  );
  const [photoChallengeEnabled, setPhotoChallengeEnabled] = useState(
    event.settings?.features?.photo_challenge_enabled || false
  );
  const luckyDrawPlanLocked = !entitlementsLoading && tenantFeatures?.lucky_draw === false;
  const reactionsPlanLocked = !entitlementsLoading && tenantFeatures?.photo_reactions === false;

  // Security state
  const [uploadRateLimits, setUploadRateLimits] = useState({
    ...DEFAULT_UPLOAD_RATE_LIMITS,
    ...(event.settings?.security?.upload_rate_limits || {}),
  });
  const [maxPhotosPerUser, setMaxPhotosPerUser] = useState(
    Math.max(1, event.settings?.limits?.max_photos_per_user || 5)
  );
  const [maxTotalPhotos, setMaxTotalPhotos] = useState(
    Math.max(1, event.settings?.limits?.max_total_photos || 50)
  );

  const subTabs: { id: SettingsSubTab; label: string; icon: LucideIcon }[] = [
    { id: 'basic', label: 'Basic Info', icon: Calendar },
    { id: 'theme', label: 'Theme & Design', icon: Palette },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  const markDirty = () => setHasChanges(true);

  const handleSave = async (section?: SettingsSubTab) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: eventName,
          event_type: eventType,
          event_date: new Date(eventDate).toISOString(),
          location: location || null,
          expected_guests: expectedGuests || null,
          description: description || null,
          custom_hashtag: customHashtag || null,
          short_code: shortCode || null,
          status: eventStatus,
          settings: {
            ...event.settings,
            theme: {
              ...event.settings?.theme,
              photo_card_style: photoCardStyle,
              primary_color: primaryColor,
              secondary_color: secondaryColor,
              background: backgroundColor,
              surface_color: backgroundColor,
            },
            features: {
              ...event.settings?.features,
              guest_download_enabled: guestDownloadEnabled,
              moderation_required: moderationRequired,
              anonymous_allowed: anonymousAllowed,
              lucky_draw_enabled: luckyDrawPlanLocked ? false : luckyDrawEnabled,
              reactions_enabled: reactionsPlanLocked ? false : reactionsEnabled,
              attendance_enabled: attendanceEnabled,
              photo_challenge_enabled: photoChallengeEnabled,
            },
            security: {
              upload_rate_limits: {
                ...DEFAULT_UPLOAD_RATE_LIMITS,
                ...uploadRateLimits,
              },
            },
            limits: {
              ...event.settings?.limits,
              max_photos_per_user: Math.max(1, maxPhotosPerUser),
              max_total_photos: Math.max(1, maxTotalPhotos),
              max_draw_entries: event.settings?.limits?.max_draw_entries || 100,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
      if (onUpdate && data.data) {
        onUpdate(data.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="-mx-4 overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:mx-0">
        <nav className="-mb-px flex gap-1.5 overflow-x-auto px-4 pb-1 pr-6 sm:gap-6 sm:px-0 sm:pr-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={clsx(
                  'flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2.5 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 sm:gap-2 sm:px-1 sm:py-3 sm:text-sm',
                  activeSubTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeSubTab === 'basic' && (
        <BasicTab
          eventName={eventName}
          setEventName={setEventName}
          eventType={eventType}
          setEventType={setEventType}
          eventDate={eventDate}
          setEventDate={setEventDate}
          location={location}
          setLocation={setLocation}
          expectedGuests={expectedGuests}
          setExpectedGuests={setExpectedGuests}
          description={description}
          setDescription={setDescription}
          isLoading={isLoading}
          hasChanges={hasChanges}
          onSave={() => handleSave('basic')}
          onDirty={markDirty}
        />
      )}
      {activeSubTab === 'theme' && (
        <ThemeTab
          photoCardStyle={photoCardStyle}
          setPhotoCardStyle={setPhotoCardStyle}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          isLoading={isLoading}
          hasChanges={hasChanges}
          onSave={() => handleSave('theme')}
          onDirty={markDirty}
        />
      )}
      {activeSubTab === 'features' && (
        <FeaturesTab
          guestDownloadEnabled={guestDownloadEnabled}
          setGuestDownloadEnabled={setGuestDownloadEnabled}
          moderationRequired={moderationRequired}
          setModerationRequired={setModerationRequired}
          anonymousAllowed={anonymousAllowed}
          setAnonymousAllowed={setAnonymousAllowed}
          luckyDrawEnabled={luckyDrawPlanLocked ? false : luckyDrawEnabled}
          setLuckyDrawEnabled={setLuckyDrawEnabled}
          reactionsEnabled={reactionsPlanLocked ? false : reactionsEnabled}
          setReactionsEnabled={setReactionsEnabled}
          attendanceEnabled={attendanceEnabled}
          setAttendanceEnabled={setAttendanceEnabled}
          photoChallengeEnabled={photoChallengeEnabled}
          setPhotoChallengeEnabled={setPhotoChallengeEnabled}
          luckyDrawAvailable={!luckyDrawPlanLocked}
          luckyDrawToggleDisabled={entitlementsLoading || luckyDrawPlanLocked}
          reactionsAvailable={!reactionsPlanLocked}
          reactionsToggleDisabled={entitlementsLoading || reactionsPlanLocked}
          currentTier={currentTier}
          isLoading={isLoading}
          hasChanges={hasChanges}
          onSave={() => handleSave('features')}
          onDirty={markDirty}
        />
      )}
      {activeSubTab === 'security' && (
        <SecurityTab
          uploadRateLimits={uploadRateLimits}
          setUploadRateLimits={setUploadRateLimits}
          maxPhotosPerUser={maxPhotosPerUser}
          setMaxPhotosPerUser={setMaxPhotosPerUser}
          maxTotalPhotos={maxTotalPhotos}
          setMaxTotalPhotos={setMaxTotalPhotos}
          isLoading={isLoading}
          hasChanges={hasChanges}
          onSave={() => handleSave('security')}
          onDirty={markDirty}
        />
      )}
      {activeSubTab === 'advanced' && (
        <AdvancedTab
          shortCode={shortCode}
          setShortCode={setShortCode}
          customHashtag={customHashtag}
          setCustomHashtag={setCustomHashtag}
          eventStatus={eventStatus}
          setEventStatus={setEventStatus}
          isLoading={isLoading}
          hasChanges={hasChanges}
          onSave={() => handleSave('advanced')}
          onDirty={markDirty}
        />
      )}
    </div>
  );
}
