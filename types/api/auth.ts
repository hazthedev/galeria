// ============================================
// Auth API Types
// ============================================

import type { IUser, UserRole } from '../domain/user';
import type { ITenant } from '../domain/tenant';

export interface IJWTPayload {
  sub: string; // user id
  tenant_id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}

// Session types (Redis-based)
export interface ISessionData {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  name: string;
  createdAt: number; // Unix timestamp in milliseconds
  lastActivity: number; // Unix timestamp in milliseconds
  expiresAt: number; // Unix timestamp in milliseconds
  ipAddress?: string;
  userAgent?: string;
  rememberMe: boolean;
  impersonation?: {
    actorUserId: string;
    actorTenantId: string;
    actorEmail: string;
    actorName: string;
    actorRole: UserRole;
    actorSessionId: string;
    startedAt: number;
    readOnly: boolean;
  };
}

export interface ISessionValidationResult {
  valid: boolean;
  session?: ISessionData;
  user?: IUser;
  error?: string;
}

export interface ISessionOptions {
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

// Authentication error types
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TENANT_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface IAuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, unknown>;
}

// Password types
export interface IPasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedSpecialChars?: string;
}

export interface IPasswordValidationResult {
  valid: boolean;
  strength: 'weak' | 'moderate' | 'strong' | 'very-strong';
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}
