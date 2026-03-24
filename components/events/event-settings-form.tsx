// ============================================
// GALERIA - Event Settings Form Component
// ============================================
// Theme customization and feature toggles for organizers

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, Eye, Heart, Sparkles, Palette, Users, Target, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import type { IEvent, IEventTheme, IEventFeatures } from '@/lib/types';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { useOrganizerEntitlements } from '@/lib/use-organizer-entitlements';

const PHOTO_CARD_STYLES = [
    { id: 'vacation', label: 'Vacation', description: 'Bright, airy, postcard vibe' },
    { id: 'brutalist', label: 'Brutalist Minimal', description: 'Bold borders, raw contrast' },
    { id: 'wedding', label: 'Wedding', description: 'Soft, romantic, refined' },
    { id: 'celebration', label: 'Celebration', description: 'Warm, festive, joyful' },
    { id: 'futuristic', label: 'Futuristic', description: 'Neon glow, sleek tech' },
];

const PHOTO_CARD_STYLE_CLASSES: Record<string, string> = {
    vacation: 'rounded-2xl bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5',
    brutalist: 'rounded-none bg-white border-2 border-black shadow-[6px_6px_0_#000]',
    wedding: 'rounded-3xl bg-white border border-rose-200 shadow-[0_8px_24px_rgba(244,114,182,0.25)]',
    celebration: 'rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-pink-50 border border-amber-200 shadow-[0_10px_26px_rgba(249,115,22,0.25)]',
    futuristic: 'rounded-2xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.35)]',
};

const THEME_PRESETS = [
    {
        id: 'palette-1',
        label: 'Vibrant Travel',
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        background: 'linear-gradient(135deg, #FFE5E5 0%, #FFF5E1 50%, #E0F7F4 100%)',
    },
    {
        id: 'palette-2',
        label: 'Tropical Paradise',
        primary: '#06B6D4',
        secondary: '#10B981',
        background: 'linear-gradient(135deg, #E0F7FA 0%, #E8F5E9 50%, #FFF3E0 100%)',
    },
    {
        id: 'palette-3',
        label: 'Refined Purple',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        background: 'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 50%, #FFF8E1 100%)',
    },
    {
        id: 'palette-4',
        label: 'Sunset Glow',
        primary: '#F97316',
        secondary: '#DC2626',
        background: 'linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 50%, #FFF9C4 100%)',
    },
    {
        id: 'palette-5',
        label: 'Ocean Breeze',
        primary: '#0EA5E9',
        secondary: '#6366F1',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #EDE7F6 50%, #E0F2F1 100%)',
    },
];

const DEFAULT_UPLOAD_RATE_LIMITS = {
    per_ip_hourly: 10,
    per_fingerprint_hourly: 10,
    burst_per_ip_minute: 5,
    per_event_daily: 100,
};

// ============================================
// TYPES
// ============================================

interface EventSettingsFormProps {
    event: IEvent;
    onSuccess?: (event: IEvent) => void;
    className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function EventSettingsForm({
    event,
    onSuccess,
    className,
}: EventSettingsFormProps) {
    const {
        tier: organizerTier,
        features: organizerFeatures,
        isLoading: entitlementsLoading,
    } = useOrganizerEntitlements();
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
    const [showPreview, setShowPreview] = useState(false);

    // Feature toggles
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
    const [lightboxEnabled, setLightboxEnabled] = useState(
        event.settings?.features?.lightbox_enabled !== false
    );
    const [uploadRateLimits, setUploadRateLimits] = useState({
        ...DEFAULT_UPLOAD_RATE_LIMITS,
        ...(event.settings?.security?.upload_rate_limits || {}),
    });

    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const luckyDrawPlanLocked = !entitlementsLoading && organizerFeatures?.lucky_draw === false;
    const reactionsPlanLocked = !entitlementsLoading && organizerFeatures?.photo_reactions === false;
    const effectiveLuckyDrawEnabled = luckyDrawPlanLocked ? false : luckyDrawEnabled;
    const effectiveReactionsEnabled = reactionsPlanLocked ? false : reactionsEnabled;

    // Track changes
    useEffect(() => {
        const originalFeatures = event.settings?.features || {};
        const originalTheme = event.settings?.theme || {};
        const originalSecurity = event.settings?.security?.upload_rate_limits || DEFAULT_UPLOAD_RATE_LIMITS;
        const originalLuckyDrawEnabled = luckyDrawPlanLocked
            ? false
            : (originalFeatures.lucky_draw_enabled !== false);
        const originalReactionsEnabled = reactionsPlanLocked
            ? false
            : (originalFeatures.reactions_enabled !== false);

        const featuresChanged =
            guestDownloadEnabled !== (originalFeatures.guest_download_enabled !== false) ||
            moderationRequired !== (originalFeatures.moderation_required || false) ||
            anonymousAllowed !== (originalFeatures.anonymous_allowed !== false) ||
            effectiveLuckyDrawEnabled !== originalLuckyDrawEnabled ||
            effectiveReactionsEnabled !== originalReactionsEnabled ||
            attendanceEnabled !== (originalFeatures.attendance_enabled !== false) ||
            photoChallengeEnabled !== (originalFeatures.photo_challenge_enabled || false) ||
            lightboxEnabled !== (originalFeatures.lightbox_enabled !== false);

        const themeChanged =
            photoCardStyle !== (originalTheme.photo_card_style || 'vacation') ||
            primaryColor !== (originalTheme.primary_color || '#8B5CF6') ||
            secondaryColor !== (originalTheme.secondary_color || '#EC4899') ||
            backgroundColor !== (originalTheme.background || '#F9FAFB');

        const securityChanged =
            uploadRateLimits.per_ip_hourly !== (originalSecurity.per_ip_hourly ?? DEFAULT_UPLOAD_RATE_LIMITS.per_ip_hourly) ||
            uploadRateLimits.per_fingerprint_hourly !== (originalSecurity.per_fingerprint_hourly ?? DEFAULT_UPLOAD_RATE_LIMITS.per_fingerprint_hourly) ||
            uploadRateLimits.burst_per_ip_minute !== (originalSecurity.burst_per_ip_minute ?? DEFAULT_UPLOAD_RATE_LIMITS.burst_per_ip_minute) ||
            uploadRateLimits.per_event_daily !== (originalSecurity.per_event_daily ?? DEFAULT_UPLOAD_RATE_LIMITS.per_event_daily);

        setHasChanges(featuresChanged || themeChanged || securityChanged);
    }, [
        guestDownloadEnabled,
        moderationRequired,
        anonymousAllowed,
        luckyDrawEnabled,
        luckyDrawPlanLocked,
        effectiveLuckyDrawEnabled,
        reactionsEnabled,
        reactionsPlanLocked,
        effectiveReactionsEnabled,
        attendanceEnabled,
        photoChallengeEnabled,
        lightboxEnabled,
        photoCardStyle,
        primaryColor,
        secondaryColor,
        backgroundColor,
        uploadRateLimits,
        event,
    ]);

    // Save settings
    const handleSave = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
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
                            lucky_draw_enabled: effectiveLuckyDrawEnabled,
                            reactions_enabled: effectiveReactionsEnabled,
                            attendance_enabled: attendanceEnabled,
                            photo_challenge_enabled: photoChallengeEnabled,
                            lightbox_enabled: lightboxEnabled,
                        },
                        security: {
                            upload_rate_limits: {
                                ...DEFAULT_UPLOAD_RATE_LIMITS,
                                ...uploadRateLimits,
                            },
                        },
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            toast.success('Settings saved successfully!');
            setHasChanges(false);
            onSuccess?.(data.data);
        } catch (error) {
            console.error('[EVENT_SETTINGS] Error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={clsx('space-y-8', className)}>
            {/* Photo Card Style */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Photo Card Style
                    </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {PHOTO_CARD_STYLES.map((style) => {
                        const selected = photoCardStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                type="button"
                                onClick={() => setPhotoCardStyle(style.id)}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                                    selected
                                        ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20'
                                        : 'border-gray-200 bg-white hover:border-violet-300 dark:border-gray-700 dark:bg-gray-800'
                                )}
                            >
                                <div className={clsx(
                                    'flex h-16 w-16 items-center justify-center overflow-hidden',
                                    PHOTO_CARD_STYLE_CLASSES[style.id]
                                )}>
                                    <div className="h-12 w-12 rounded-md bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {style.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {style.description}
                                    </p>
                                </div>
                                {selected && (
                                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                        Active
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Applied to guest photo cards on the event page.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                        Preview selected style
                    </button>
                </div>
            </div>

            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Photo Card Preview
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className={clsx(
                                'w-64 max-w-full overflow-hidden',
                                PHOTO_CARD_STYLE_CLASSES[photoCardStyle]
                            )}>
                                <div className="relative aspect-square w-full overflow-hidden rounded-[inherit]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700" />
                                    <div
                                        className={clsx(
                                            'absolute inset-0 flex items-center justify-center text-sm font-semibold',
                                            photoCardStyle === 'futuristic'
                                                ? 'text-cyan-100'
                                                : 'text-gray-700 dark:text-gray-200'
                                        )}
                                    >
                                        Preview Photo
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {PHOTO_CARD_STYLES.find((style) => style.id === photoCardStyle)?.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Guest Page Palette */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Guest Page Palette
                    </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {THEME_PRESETS.map((preset) => {
                        const isActive =
                            preset.primary === primaryColor &&
                            preset.secondary === secondaryColor &&
                            preset.background === backgroundColor;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                    setPrimaryColor(preset.primary);
                                    setSecondaryColor(preset.secondary);
                                    setBackgroundColor(preset.background);
                                }}
                                className={clsx(
                                    'flex items-center justify-between rounded-xl border p-3 text-left transition-colors',
                                    isActive
                                        ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20'
                                        : 'border-gray-200 bg-white hover:border-violet-300 dark:border-gray-700 dark:bg-gray-800'
                                )}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {preset.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {preset.primary} • {preset.secondary}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-8 w-8 rounded-lg border border-white/40 shadow-inner"
                                        style={{ background: preset.background }}
                                    />
                                    <div
                                        className="h-8 w-8 rounded-lg border border-white/40 shadow-inner"
                                        style={{ background: preset.primary }}
                                    />
                                    <div
                                        className="h-8 w-8 rounded-lg border border-white/40 shadow-inner"
                                        style={{ background: preset.secondary }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    This palette controls the guest page background, buttons, and accent colors.
                </p>
            </div>

            {/* Feature Toggles Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Guest Features
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Lucky Draw Toggle */}
                    <label className={clsx(
                        'flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors dark:border-gray-600 dark:bg-gray-800',
                        luckyDrawPlanLocked || entitlementsLoading
                            ? 'cursor-not-allowed opacity-80'
                            : 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-500'
                    )}>
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Enable Lucky Draw
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {luckyDrawPlanLocked
                                        ? 'Upgrade to Pro to enable lucky draw entries and prize management'
                                        : 'Allow guests to enter photos into the lucky draw'}
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => {
                                if (!luckyDrawPlanLocked && !entitlementsLoading) {
                                    setLuckyDrawEnabled(!luckyDrawEnabled);
                                }
                            }}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors',
                                effectiveLuckyDrawEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    effectiveLuckyDrawEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {luckyDrawPlanLocked && (
                        <UpgradePrompt
                            variant="inline"
                            title="Upgrade to unlock Lucky Draw"
                            message="Your current plan does not include Lucky Draw. Upgrade to configure entries, prize tiers, and winner selection for this event."
                            currentTier={organizerTier || 'free'}
                            recommendedTier="pro"
                            featureBlocked="Lucky Draw"
                        />
                    )}

                    {/* Reactions Toggle */}
                    <label className={clsx(
                        'flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors dark:border-gray-600 dark:bg-gray-800',
                        reactionsPlanLocked || entitlementsLoading
                            ? 'cursor-not-allowed opacity-80'
                            : 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-500'
                    )}>
                        <div className="flex items-center gap-3">
                            <Heart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Enable Photo Reactions
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {reactionsPlanLocked
                                        ? 'Your current plan does not include guest photo reactions'
                                        : 'Let guests react to photos with hearts'}
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => {
                                if (!reactionsPlanLocked && !entitlementsLoading) {
                                    setReactionsEnabled(!reactionsEnabled);
                                }
                            }}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors',
                                effectiveReactionsEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    effectiveReactionsEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Attendance Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Enable Attendance Check-in
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow guests to check in and track attendance
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setAttendanceEnabled(!attendanceEnabled)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                attendanceEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    attendanceEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Photo Challenge Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Enable Photo Challenge
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Motivate guests with photo upload goals and prizes
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setPhotoChallengeEnabled(!photoChallengeEnabled)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                photoChallengeEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    photoChallengeEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Guest Download Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Allow Photo Downloads
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Guests can download photos from the gallery
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setGuestDownloadEnabled(!guestDownloadEnabled)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                guestDownloadEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    guestDownloadEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Photo Lightbox Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Maximize2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Enable Photo Lightbox
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow guests to tap photos for full-screen viewing with zoom
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setLightboxEnabled(!lightboxEnabled)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                lightboxEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    lightboxEnabled ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Moderation Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Require Photo Moderation
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Photos need approval before appearing in gallery
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setModerationRequired(!moderationRequired)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                moderationRequired ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    moderationRequired ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>

                    {/* Anonymous Toggle */}
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-violet-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Allow Anonymous Uploads
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Guests can upload without sharing their name
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setAnonymousAllowed(!anonymousAllowed)}
                            className={clsx(
                                'relative h-6 w-11 rounded-full transition-colors cursor-pointer',
                                anonymousAllowed ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        >
                            <div
                                className={clsx(
                                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                                    anonymousAllowed ? 'left-[22px]' : 'left-0.5'
                                )}
                            />
                        </div>
                    </label>
                </div>
            </div>

            {/* Upload Rate Limits */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Upload Security Limits
                    </h3>
                </div>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
                        <span>Per IP (per hour)</span>
                        <input
                            type="number"
                            min={1}
                            value={uploadRateLimits.per_ip_hourly}
                            onChange={(e) =>
                                setUploadRateLimits((prev) => ({
                                    ...prev,
                                    per_ip_hourly: parseInt(e.target.value || '0', 10),
                                }))
                            }
                            className="w-40 rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
                        <span>Per fingerprint (per hour)</span>
                        <input
                            type="number"
                            min={1}
                            value={uploadRateLimits.per_fingerprint_hourly}
                            onChange={(e) =>
                                setUploadRateLimits((prev) => ({
                                    ...prev,
                                    per_fingerprint_hourly: parseInt(e.target.value || '0', 10),
                                }))
                            }
                            className="w-40 rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
                        <span>Burst per IP (per minute)</span>
                        <input
                            type="number"
                            min={1}
                            value={uploadRateLimits.burst_per_ip_minute}
                            onChange={(e) =>
                                setUploadRateLimits((prev) => ({
                                    ...prev,
                                    burst_per_ip_minute: parseInt(e.target.value || '0', 10),
                                }))
                            }
                            className="w-40 rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
                        <span>Per event (per day)</span>
                        <input
                            type="number"
                            min={1}
                            value={uploadRateLimits.per_event_daily}
                            onChange={(e) =>
                                setUploadRateLimits((prev) => ({
                                    ...prev,
                                    per_event_daily: parseInt(e.target.value || '0', 10),
                                }))
                            }
                            className="w-40 rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
                        />
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleSave}
                    disabled={isLoading || !hasChanges}
                    className={clsx(
                        'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
                        hasChanges
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </div>
    );
}

export default EventSettingsForm;
