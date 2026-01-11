// ============================================
// MOMENTIQUE - WebSocket Server (Socket.io)
// ============================================
// Real-time features for live photo updates and lucky draws

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'socket.io';
import type {
  IPhoto,
  IWinner,
  ILuckyDrawConfig,
  IEventStats,
} from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface AuthenticatedSocket extends Socket {
  tenantId?: string;
  userId?: string;
  fingerprint?: string;
  currentEventId?: string;
}

interface ServerToClientEvents {
  new_photo: (photo: IPhoto) => void;
  photo_updated: (data: { photo_id: string; status: string }) => void;
  stats_update: (stats: IEventStats) => void;
  draw_started: (config: ILuckyDrawConfig) => void;
  draw_winner: (winner: IWinner) => void;
  reaction_added: (data: { photo_id: string; emoji: string; count: number }) => void;
  user_joined: (data: { event_id: string; user_count: number }) => void;
  user_left: (data: { event_id: string; user_count: number }) => void;
  error: (error: { message: string; code?: string }) => void;
}

interface ClientToServerEvents {
  join_event: (data: { event_id: string; fingerprint?: string }) => void;
  leave_event: (data: { event_id: string }) => void;
  upload_photo: (data: { event_id: string; photo_data: IPhoto }) => void;
  add_reaction: (data: { photo_id: string; emoji: string }) => void;
  // Admin events
  start_draw: (data: { event_id: string; config: ILuckyDrawConfig }) => void;
  moderate_photo: (data: { photo_id: string; action: 'approve' | 'reject' }) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;
const corsOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// SERVER CLASS
// ============================================

export class WebSocketServer {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
  private httpServer: HTTPServer | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  /**
   * Initialize the WebSocket server
   */
  async initialize(port: number = 3001): Promise<void> {
    console.log('[WS] Initializing WebSocket server...');

    // Create HTTP server
    this.httpServer = createServer();

    // Create Redis clients for adapter
    this.pubClient = new Redis(redisUrl, {
      password: redisPassword,
      retryStrategy: () => {
        console.log('[WS] Redis reconnecting...');
        return 5000;
      },
    });

    this.subClient = this.pubClient.duplicate();

    // Create Socket.io server
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
      this.httpServer,
      {
        cors: {
          origin: corsOrigin,
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 30000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e7, // 10MB for photo uploads
      }
    );

    // Set up Redis adapter for horizontal scaling
    this.io.adapter(createAdapter(this.pubClient, this.subClient));
    console.log('[WS] Redis adapter configured');

    // Set up authentication middleware
    this.io.use((socket, next) => {
      this.authenticateSocket(socket as AuthenticatedSocket, next);
    });

    // Set up event handlers
    this.setupEventHandlers();

    // Start listening
    this.httpServer.listen(port, () => {
      console.log(`[WS] WebSocket server listening on port ${port}`);
    });

    // Handle Redis connection events
    this.pubClient.on('connect', () => {
      console.log('[WS] Redis pub client connected');
    });

    this.pubClient.on('error', (err) => {
      console.error('[WS] Redis pub client error:', err);
    });

    this.subClient.on('connect', () => {
      console.log('[WS] Redis sub client connected');
    });

    this.subClient.on('error', (err) => {
      console.error('[WS] Redis sub client error:', err);
    });
  }

  /**
   * Authenticate socket connection
   */
  private authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): void {
    const tenantId = socket.handshake.auth.tenantId;
    const userId = socket.handshake.auth.userId;
    const fingerprint = socket.handshake.auth.fingerprint;

    // For public events, we only need fingerprint
    // For admin features, we need userId
    if (!fingerprint && !userId) {
      return next(new Error('Authentication required'));
    }

    socket.tenantId = tenantId;
    socket.userId = userId;
    socket.fingerprint = fingerprint;

    console.log('[WS] Socket authenticated:', {
      id: socket.id,
      tenantId,
      userId,
      hasFingerprint: !!fingerprint,
    });

    next();
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('[WS] Client connected:', socket.id);

      // Handle join event
      socket.on('join_event', (data) => {
        this.handleJoinEvent(socket, data);
      });

      // Handle leave event
      socket.on('leave_event', (data) => {
        this.handleLeaveEvent(socket, data);
      });

      // Handle photo upload (via WebSocket as alternative to HTTP)
      socket.on('upload_photo', (data) => {
        this.handlePhotoUpload(socket, data);
      });

      // Handle reaction
      socket.on('add_reaction', (data) => {
        this.handleAddReaction(socket, data);
      });

      // Admin: Start lucky draw
      socket.on('start_draw', (data) => {
        this.handleStartDraw(socket, data);
      });

      // Admin: Moderate photo
      socket.on('moderate_photo', (data) => {
        this.handleModeratePhoto(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle error
      socket.on('error', (err) => {
        console.error('[WS] Socket error:', socket.id, err);
      });
    });
  }

  /**
   * Handle join event
   */
  private async handleJoinEvent(
    socket: AuthenticatedSocket,
    data: { event_id: string; fingerprint?: string }
  ): Promise<void> {
    const { event_id } = data;

    console.log('[WS] Client joining event:', {
      socketId: socket.id,
      eventId: event_id,
    });

    try {
      // Join event room
      const roomName = `event:${event_id}`;
      await socket.join(roomName);

      // Track current event for this socket
      socket.currentEventId = event_id;

      // Get number of users in room
      const roomSize = (await this.io?.in(roomName).fetchSockets())?.length || 0;

      // Notify others in room
      socket.to(roomName).emit('user_joined', {
        event_id,
        user_count: roomSize,
      });

      // Send current stats to joining user
      // TODO: Fetch actual stats from database
      const stats: IEventStats = {
        event_id,
        unique_visitors: roomSize,
        total_visits: roomSize,
        photos_uploaded: 0,
        draw_entries: 0,
        total_reactions: 0,
      };

      socket.emit('stats_update', stats);

      console.log('[WS] Client joined event:', {
        socketId: socket.id,
        eventId: event_id,
        roomSize,
      });
    } catch (error) {
      console.error('[WS] Error joining event:', error);
      socket.emit('error', {
        message: 'Failed to join event',
        code: 'JOIN_FAILED',
      });
    }
  }

  /**
   * Handle leave event
   */
  private async handleLeaveEvent(
    socket: AuthenticatedSocket,
    data: { event_id: string }
  ): Promise<void> {
    const { event_id } = data;

    console.log('[WS] Client leaving event:', {
      socketId: socket.id,
      eventId: event_id,
    });

    try {
      const roomName = `event:${event_id}`;
      await socket.leave(roomName);

      // Get remaining users in room
      const roomSize = (await this.io?.in(roomName).fetchSockets())?.length || 0;

      // Notify others in room
      socket.to(roomName).emit('user_left', {
        event_id,
        user_count: roomSize,
      });

      // Clear current event
      socket.currentEventId = undefined;

      console.log('[WS] Client left event:', {
        socketId: socket.id,
        eventId: event_id,
        roomSize,
      });
    } catch (error) {
      console.error('[WS] Error leaving event:', error);
    }
  }

  /**
   * Handle photo upload (via WebSocket)
   */
  private async handlePhotoUpload(
    socket: AuthenticatedSocket,
    data: { event_id: string; photo_data: IPhoto }
  ): Promise<void> {
    const { event_id, photo_data } = data;

    console.log('[WS] Photo uploaded via WebSocket:', {
      socketId: socket.id,
      eventId: event_id,
      photoId: photo_data.id,
    });

    try {
      // TODO: Save to database
      // TODO: Upload to storage
      // TODO: Process thumbnails

      // Broadcast to all clients in event room
      const roomName = `event:${event_id}`;
      this.io?.to(roomName).emit('new_photo', photo_data);

      // Update stats
      // TODO: Fetch and broadcast updated stats

      console.log('[WS] Photo broadcasted to room:', roomName);
    } catch (error) {
      console.error('[WS] Error uploading photo:', error);
      socket.emit('error', {
        message: 'Failed to upload photo',
        code: 'UPLOAD_FAILED',
      });
    }
  }

  /**
   * Handle add reaction
   */
  private async handleAddReaction(
    socket: AuthenticatedSocket,
    data: { photo_id: string; emoji: string }
  ): Promise<void> {
    const { photo_id, emoji } = data;

    console.log('[WS] Reaction added:', {
      socketId: socket.id,
      photoId: photo_id,
      emoji,
    });

    try {
      // TODO: Update reaction count in database
      // TODO: Check rate limiting (max 1 reaction per user per photo)

      // Broadcast to all clients in current event room
      if (socket.currentEventId) {
        const roomName = `event:${socket.currentEventId}`;
        this.io?.to(roomName).emit('reaction_added', {
          photo_id,
          emoji,
          count: 1, // TODO: Fetch actual count
        });
      }

      console.log('[WS] Reaction broadcasted');
    } catch (error) {
      console.error('[WS] Error adding reaction:', error);
      socket.emit('error', {
        message: 'Failed to add reaction',
        code: 'REACTION_FAILED',
      });
    }
  }

  /**
   * Handle start lucky draw (admin only)
   */
  private async handleStartDraw(
    socket: AuthenticatedSocket,
    data: { event_id: string; config: ILuckyDrawConfig }
  ): Promise<void> {
    const { event_id, config } = data;

    console.log('[WS] Starting lucky draw:', {
      socketId: socket.id,
      eventId: event_id,
      config,
    });

    try {
      // Verify admin permissions
      if (!socket.userId) {
        socket.emit('error', {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // TODO: Verify user is admin or event organizer

      // Broadcast draw started to all clients in event room
      const roomName = `event:${event_id}`;
      this.io?.to(roomName).emit('draw_started', config);

      // Run draw animation and select winner
      // TODO: Implement actual draw logic
      setTimeout(async () => {
        // TODO: Select winner from database
        const winner: IWinner = {
          id: 'winner-id',
          event_id,
          entry_id: 'entry-id',
          participant_name: 'John Doe',
          selfie_url: 'https://example.com/selfie.jpg',
          prize_tier: 1,
          drawn_at: new Date(),
          drawn_by: socket.userId!,
          is_claimed: false,
        };

        // Broadcast winner
        this.io?.to(roomName).emit('draw_winner', winner);

        console.log('[WS] Lucky draw completed:', {
          eventId: event_id,
          winner: winner.participant_name,
        });
      }, config.animation_duration * 1000);

      console.log('[WS] Lucky draw started');
    } catch (error) {
      console.error('[WS] Error starting draw:', error);
      socket.emit('error', {
        message: 'Failed to start draw',
        code: 'DRAW_FAILED',
      });
    }
  }

  /**
   * Handle moderate photo (admin only)
   */
  private async handleModeratePhoto(
    socket: AuthenticatedSocket,
    data: { photo_id: string; action: 'approve' | 'reject' }
  ): Promise<void> {
    const { photo_id, action } = data;

    console.log('[WS] Photo moderation:', {
      socketId: socket.id,
      photoId: photo_id,
      action,
    });

    try {
      // Verify admin permissions
      if (!socket.userId) {
        socket.emit('error', {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // TODO: Update photo status in database
      // TODO: Notify uploader (if they have socket connection)

      // Broadcast to all clients in event room
      if (socket.currentEventId) {
        const roomName = `event:${socket.currentEventId}`;
        this.io?.to(roomName).emit('photo_updated', {
          photo_id,
          status: action === 'approve' ? 'approved' : 'rejected',
        });
      }

      console.log('[WS] Photo moderation completed');
    } catch (error) {
      console.error('[WS] Error moderating photo:', error);
      socket.emit('error', {
        message: 'Failed to moderate photo',
        code: 'MODERATION_FAILED',
      });
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    console.log('[WS] Client disconnected:', socket.id);

    // If user was in an event room, notify others
    if (socket.currentEventId) {
      const roomName = `event:${socket.currentEventId}`;

      // Get remaining users in room
      this.io?.in(roomName).fetchSockets().then((sockets) => {
        const roomSize = sockets.length;

        // Notify others in room
        socket.to(roomName).emit('user_left', {
          event_id: socket.currentEventId,
          user_count: roomSize,
        });

        console.log('[WS] Notified room of disconnect:', {
          eventId: socket.currentEventId,
          roomSize,
        });
      });
    }
  }

  /**
   * Broadcast to event room
   */
  async broadcastToEvent<K extends keyof ServerToClientEvents>(
    eventId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): Promise<void> {
    const roomName = `event:${eventId}`;
    this.io?.to(roomName).emit(event, ...args);
  }

  /**
   * Get number of connected users in event
   */
  async getEventUserCount(eventId: string): Promise<number> {
    const roomName = `event:${eventId}`;
    const sockets = await this.io?.in(roomName).fetchSockets();
    return sockets?.length || 0;
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    console.log('[WS] Closing WebSocket server...');

    // Close Redis connections
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }

    // Close Socket.io server
    if (this.io) {
      await this.io.close();
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer?.close(() => resolve());
      });
    }

    console.log('[WS] WebSocket server closed');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let wsServer: WebSocketServer | null = null;

export function getWebSocketServer(): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer();
  }
  return wsServer;
}

export async function initializeWebSocket(
  port: number = 3001
): Promise<void> {
  const server = getWebSocketServer();
  await server.initialize(port);
}

export async function closeWebSocket(): Promise<void> {
  if (wsServer) {
    await wsServer.close();
    wsServer = null;
  }
}
