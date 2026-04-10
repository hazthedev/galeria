// ============================================
// API Response Types
// ============================================

import type { IUser } from '../domain/user';
import type { ITenant } from '../domain/tenant';
import type { ISessionData } from './auth';

export interface IAuthResponseSession {
  success: boolean;
  user?: IUser;
  sessionId?: string;
  message?: string;
  error?: string;
}

export interface IMeResponse {
  user: IUser;
  tenant?: ITenant;
  session?: ISessionData | null;
}

export type ApiError = {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  code?: string;
};

export type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Real-time types
export type SocketEvent =
  | 'join_event'
  | 'leave_event'
  | 'new_photo'
  | 'photo_updated'
  | 'stats_update'
  | 'draw_started'
  | 'draw_winner'
  | 'draw_cancelled'
  | 'reaction_added'
  | 'user_joined'
  | 'user_left';

export interface ISocketEventData {
  join_event: { event_id: string };
  leave_event: { event_id: string };
  new_photo: import('../domain/photo').IPhoto;
  photo_updated: { photo_id: string; status: import('../domain/photo').PhotoStatus; event_id?: string };
  stats_update: IEventStats;
  draw_started: import('../domain/lucky-draw').ILuckyDrawConfig;
  draw_winner: import('../domain/lucky-draw').IWinner;
  reaction_added: { photo_id: string; emoji: string; count: number };
  user_joined: { event_id: string; user_count: number };
  user_left: { event_id: string; user_count: number };
}

export interface IEventStats {
  event_id: string;
  unique_visitors: number;
  total_visits: number;
  photos_uploaded: number;
  draw_entries: number;
  total_reactions: number;
  peak_time?: Date;
}
