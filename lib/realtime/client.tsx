// ============================================
// GATHERLY - Supabase Realtime Client Library
// ============================================
// Client-side realtime connection management using Supabase

'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { IEventStats, IPhoto, IWinner, ILuckyDrawEntry, ILuckyDrawConfig } from '@/lib/types';
import { getClientFingerprint } from '@/lib/fingerprint';

// ============================================
// TYPES
// ============================================

interface RealtimeContextValue {
    connected: boolean;
    connecting: boolean;
    error: Error | null;
    fingerprint: string | null;
}

// ============================================
// REALTIME CONTEXT
// ============================================

const RealtimeContext = createContext<RealtimeContextValue>({
    connected: false,
    connecting: true,
    error: null,
    fingerprint: null,
});

// ============================================
// REALTIME PROVIDER
// ============================================

interface RealtimeProviderProps {
    children: React.ReactNode;
}

/**
 * Realtime provider for wrapping the app
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fingerprint, setFingerprint] = useState<string | null>(null);

    useEffect(() => {
        // Get client fingerprint
        const fp = getClientFingerprint();
        setFingerprint(fp);

        // Test connection by subscribing to a system channel
        const channel = supabase.channel('system');

        channel
            .on('system', { event: '*' }, () => { })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Connected to Supabase');
                    setConnected(true);
                    setConnecting(false);
                    setError(null);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.log('[Realtime] Disconnected');
                    setConnected(false);
                    setConnecting(false);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <RealtimeContext.Provider value={{ connected, connecting, error, fingerprint }}>
            {children}
        </RealtimeContext.Provider>
    );
}

// ============================================
// USE REALTIME HOOK
// ============================================

/**
 * Hook to access the realtime context
 */
export function useRealtime(): RealtimeContextValue {
    const context = useContext(RealtimeContext);

    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }

    return context;
}

// ============================================
// EVENT-SPECIFIC HOOKS
// ============================================

/**
 * Hook for photo gallery with real-time updates
 */
export function usePhotoGallery(eventId: string) {
    const [photos, setPhotos] = useState<IPhoto[]>([]);
    const [stats, setStats] = useState<IEventStats | null>(null);
    const [userCount, setUserCount] = useState(0);
    const { connected, fingerprint } = useRealtime();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const channelName = `event:${eventId}`;
        const channel = supabase.channel(channelName, {
            config: {
                presence: { key: fingerprint || 'anonymous' },
            },
        });

        // Listen for new photos
        channel.on('broadcast', { event: 'new_photo' }, ({ payload }) => {
            console.log('[Gallery] New photo received:', payload.id);
            setPhotos((prev) => [payload as IPhoto, ...prev]);
        });

        // Listen for photo updates
        channel.on('broadcast', { event: 'photo_updated' }, ({ payload }) => {
            console.log('[Gallery] Photo updated:', payload);
            setPhotos((prev) =>
                prev.map((photo) =>
                    photo.id === payload.photo_id
                        ? { ...photo, status: payload.status as IPhoto['status'] }
                        : photo
                )
            );
        });

        // Listen for reactions
        channel.on('broadcast', { event: 'reaction_added' }, ({ payload }) => {
            console.log('[Gallery] Reaction added:', payload);
            setPhotos((prev) =>
                prev.map((photo) =>
                    photo.id === payload.photo_id
                        ? {
                            ...photo,
                            reactions: {
                                ...photo.reactions,
                                [payload.emoji]: payload.count,
                            },
                        }
                        : photo
                )
            );
        });

        // Listen for stats updates
        channel.on('broadcast', { event: 'stats_update' }, ({ payload }) => {
            console.log('[Gallery] Stats updated:', payload);
            setStats(payload as IEventStats);
        });

        // Track presence
        channel.on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const count = Object.keys(presenceState).length;
            setUserCount(count);
            console.log('[Gallery] User count:', count);
        });

        // Subscribe and track presence
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    fingerprint,
                    joined_at: new Date().toISOString(),
                });
            }
        });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, fingerprint]);

    const addReaction = useCallback(
        (photoId: string, emoji: 'heart' | 'clap' | 'laugh' | 'wow') => {
            channelRef.current?.send({
                type: 'broadcast',
                event: 'reaction_added',
                payload: { photo_id: photoId, emoji, count: 1 },
            });
        },
        []
    );

    const broadcastNewPhoto = useCallback((photo: IPhoto) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'new_photo',
            payload: photo,
        });
    }, []);

    const refreshGallery = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/photos`);
            const data = await res.json();
            setPhotos(data.data || []);
        } catch (error) {
            console.error('[Gallery] Failed to refresh:', error);
        }
    };

    return { photos, stats, userCount, addReaction, broadcastNewPhoto, refreshGallery, channel: channelRef.current };
}

/**
 * Hook for lucky draw functionality
 */
export function useLuckyDraw(eventId: string) {
    const [entries] = useState<ILuckyDrawEntry[]>([]);
    const [winner, setWinner] = useState<IWinner | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { fingerprint } = useRealtime();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const channelName = `event:${eventId}`;
        const channel = supabase.channel(channelName);

        // Listen for draw started
        channel.on('broadcast', { event: 'draw_started' }, ({ payload }) => {
            console.log('[LuckyDraw] Draw started:', payload);
            setIsDrawing(true);
            setWinner(null);

            // Show full-screen draw mode
            if (typeof document !== 'undefined') {
                document.documentElement.requestFullscreen().catch(() => {
                    console.log('[LuckyDraw] Fullscreen not supported or denied');
                });
            }
        });

        // Listen for winner announcement
        channel.on('broadcast', { event: 'draw_winner' }, ({ payload }) => {
            console.log('[LuckyDraw] Winner announced:', payload);
            setWinner(payload as IWinner);
            setIsDrawing(false);

            // Show confetti if available
            if (typeof window !== 'undefined' && 'confetti' in window) {
                try {
                    (window as unknown as { confetti: (opts: unknown) => void }).confetti?.({
                        particleCount: 100,
                        spread: 70,
                        origin: { x: 0.5, y: 0.5 },
                    });
                } catch {
                    console.log('[LuckyDraw] Confetti not available');
                }
            }
        });

        channel.subscribe();
        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, fingerprint]);

    const submitEntry = async (
        name: string,
        selfieUrl: string,
        contactInfo?: string
    ) => {
        // Entry is handled via HTTP API, not realtime
        // The entry form already uses fetch to submit
        console.log('[LuckyDraw] Entry submitted via API');
    };

    const broadcastDrawStart = useCallback((config: ILuckyDrawConfig) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'draw_started',
            payload: config,
        });
    }, []);

    const broadcastWinner = useCallback((winnerData: IWinner) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'draw_winner',
            payload: winnerData,
        });
    }, []);

    return { entries, winner, isDrawing, submitEntry, broadcastDrawStart, broadcastWinner, channel: channelRef.current };
}

/**
 * Hook for admin dashboard
 */
export function useAdminDashboard(eventId: string) {
    const [stats, setStats] = useState<IEventStats | null>(null);
    const [userCount, setUserCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState<{
        type: 'upload' | 'lucky_draw_entry' | 'reaction';
        photo_id?: string;
        timestamp: Date;
        user?: string;
        preview?: string;
    }[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const channelName = `event:${eventId}`;
        const channel = supabase.channel(channelName, {
            config: {
                presence: { key: `admin-${Date.now()}` },
            },
        });

        // Listen for stats updates
        channel.on('broadcast', { event: 'stats_update' }, ({ payload }) => {
            setStats(payload as IEventStats);
        });

        // Listen for new uploads
        channel.on('broadcast', { event: 'new_photo' }, ({ payload }) => {
            const photo = payload as IPhoto;
            console.log('[Admin] New photo uploaded:', photo.id);
            setRecentActivity((prev) => [
                {
                    type: 'upload',
                    photo_id: photo.id,
                    timestamp: new Date(),
                    user: photo.contributor_name || 'Anonymous',
                    preview: photo.images.thumbnail_url,
                },
                ...prev.slice(0, 9),
            ]);
        });

        // Track presence for user count
        channel.on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const count = Object.keys(presenceState).length;
            setUserCount(count);
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    role: 'admin',
                    joined_at: new Date().toISOString(),
                });
            }
        });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    const startDraw = async (config: ILuckyDrawConfig) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'draw_started',
            payload: config,
        });
    };

    const broadcastWinner = (winner: IWinner) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'draw_winner',
            payload: winner,
        });
    };

    const moderatePhoto = (photoId: string, action: 'approve' | 'reject') => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'photo_updated',
            payload: {
                photo_id: photoId,
                status: action === 'approve' ? 'approved' : 'rejected',
            },
        });
    };

    const deletePhoto = async (photoId: string) => {
        await fetch(`/api/photos/${photoId}`, {
            method: 'DELETE',
        });

        setRecentActivity((prev) =>
            prev.filter((activity) => activity.photo_id !== photoId)
        );
    };

    return {
        stats,
        userCount,
        recentActivity,
        startDraw,
        broadcastWinner,
        moderatePhoto,
        deletePhoto,
        channel: channelRef.current,
    };
}

// ============================================
// EXPORTS
// ============================================

export { supabase };
