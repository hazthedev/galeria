// ============================================
// MOMENTIQUE - WebSocket Client Library
// ============================================
// Client-side WebSocket connection management for Next.js

'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io as io, Socket } from 'socket.io-client';
import type { IEventStats, IPhoto, IWinner, ILuckyDrawEntry, ILuckyDrawConfig } from '@/lib/types';
import { getClientFingerprint } from '@/lib/fingerprint';

// ============================================
// CONFIGURATION
// ============================================

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// ============================================
// TYPES
// ============================================

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

// ============================================
// SOCKET CONTEXT
// ============================================

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  connecting: false,
  error: null,
});

// ============================================
// SOCKET PROVIDER
// ============================================

interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket provider for wrapping the app
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize connection
  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      return;
    }

    const fingerprint = getClientFingerprint();

    const socketInstance = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
      auth: {
        fingerprint,
      },
    });

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected');
      setSocket(socketInstance);
      setConnected(true);
      setConnecting(false);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setConnected(false);
      setConnecting(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      setError(err as Error);
      setConnecting(false);
    });

    socketInstance.on('error', (err) => {
      console.error('[WebSocket] Error:', err);
      setError(err as Error);
    });

    socketRef.current = socketInstance;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, connecting, error }}>
      {children}
    </SocketContext.Provider>
  );
}

// ============================================
// USE SOCKET HOOK
// ============================================

/**
 * Hook to access the socket context
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a WebSocketProvider');
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
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!connected || !socket || !eventId) return;

    // Join event room
    socket.emit('join_event', { event_id: eventId });

    // Listen for new photos
    const handleNewPhoto = (photo: IPhoto) => {
      console.log('[Gallery] New photo received:', photo.id);
      setPhotos((prev) => [photo, ...prev]);
    };

    // Listen for photo updates
    const handlePhotoUpdated = (data: { photo_id: string; status: string }) => {
      console.log('[Gallery] Photo updated:', data);
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === data.photo_id
            ? { ...photo, status: data.status as IPhoto['status'] }
            : photo
        )
      );
    };

    // Listen for reactions
    const handleReactionAdded = (data: {
      photo_id: string;
      emoji: string;
      count: number;
    }) => {
      console.log('[Gallery] Reaction added:', data);
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === data.photo_id
            ? {
                ...photo,
                reactions: {
                  ...photo.reactions,
                  [data.emoji]: data.count,
                },
              }
            : photo
        )
      );
    };

    // Listen for stats updates
    const handleStatsUpdate = (eventStats: IEventStats) => {
      console.log('[Gallery] Stats updated:', eventStats);
      setStats(eventStats);
    };

    socket.on('new_photo', handleNewPhoto);
    socket.on('photo_updated', handlePhotoUpdated);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('stats_update', handleStatsUpdate);

    return () => {
      socket?.emit('leave_event', { event_id: eventId });
      socket?.off('new_photo', handleNewPhoto);
      socket?.off('photo_updated', handlePhotoUpdated);
      socket?.off('reaction_added', handleReactionAdded);
      socket?.off('stats_update', handleStatsUpdate);
    };
  }, [eventId, socket, connected]);

  const addReaction = (
    photoId: string,
    emoji: 'heart' | 'clap' | 'laugh' | 'wow'
  ) => {
    socket?.emit('add_reaction', { photo_id: photoId, emoji });
  };

  const refreshGallery = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/photos`);
      const data = await res.json();
      setPhotos(data.data || []);
    } catch (error) {
      console.error('[Gallery] Failed to refresh:', error);
    }
  };

  return { photos, stats, addReaction, refreshGallery };
}

/**
 * Hook for lucky draw functionality
 */
export function useLuckyDraw(eventId: string) {
  const [entries] = useState<ILuckyDrawEntry[]>([]);
  const [winner, setWinner] = useState<IWinner | null>(null);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!connected || !socket || !eventId) return;

    // Join event room
    socket.emit('join_event', { event_id: eventId });

    // Listen for draw started
    const handleDrawStarted = (config: ILuckyDrawConfig) => {
      console.log('[LuckyDraw] Draw started:', config);
      // Show full-screen draw mode
      if (typeof document !== 'undefined') {
        document.documentElement.requestFullscreen().catch(() => {
          console.log('[LuckyDraw] Fullscreen not supported or denied');
        });
      }
    };

    // Listen for winner announcement
    const handleWinner = (winnerData: IWinner) => {
      console.log('[LuckyDraw] Winner announced:', winnerData);
      setWinner(winnerData);

      // Show confetti if available
      if (typeof window !== 'undefined' && 'confetti' in window) {
        try {
          window.confetti?.({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.5 },
          });
        } catch {
          console.log('[LuckyDraw] Confetti not available');
        }
      }
    };

    socket.on('draw_started', handleDrawStarted);
    socket.on('draw_winner', handleWinner);

    return () => {
      socket?.emit('leave_event', { event_id: eventId });
      socket?.off('draw_started', handleDrawStarted);
      socket?.off('draw_winner', handleWinner);
    };
  }, [eventId, socket, connected]);

  const submitEntry = async (
    name: string,
    selfieUrl: string,
    contactInfo?: string
  ) => {
    socket?.emit('join_lucky_draw', {
      event_id: eventId,
      participant_name: name,
      selfie_url: selfieUrl,
      contact_info: contactInfo || '',
      agreed_to_display: true,
    });
  };

  return { entries, winner, submitEntry, socket };
}

/**
 * Hook for admin dashboard
 */
export function useAdminDashboard(eventId: string) {
  const [stats, setStats] = useState<IEventStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<{
    type: 'upload' | 'lucky_draw_entry' | 'reaction';
    photo_id?: string;
    timestamp: Date;
    user?: string;
    preview?: string;
  }[]>([]);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!connected || !socket || !eventId) return;

    // Join event room as admin
    socket.emit('join_event', { event_id: eventId, role: 'admin' });

    // Listen for stats updates
    const handleStatsUpdate = (eventStats: IEventStats) => {
      setStats(eventStats);
    };

    // Listen for new uploads
    const handleNewPhoto = (photo: IPhoto) => {
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
    };

    socket.on('stats_update', handleStatsUpdate);
    socket.on('new_photo', handleNewPhoto);

    return () => {
      socket?.emit('leave_event', { event_id: eventId });
      socket?.off('stats_update', handleStatsUpdate);
      socket?.off('new_photo', handleNewPhoto);
    };
  }, [eventId, socket, connected]);

  const startDraw = async (config: ILuckyDrawConfig) => {
    socket?.emit('start_draw', {
      event_id: eventId,
      config,
    });
  };

  const moderatePhoto = (photoId: string, action: 'approve' | 'reject') => {
    socket?.emit('moderate_photo', {
      action,
      photo_id: photoId,
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
    recentActivity,
    startDraw,
    moderatePhoto,
    deletePhoto,
  };
}

// ============================================
// EXPORTS
// ============================================

export type { Socket } from 'socket.io-client';
