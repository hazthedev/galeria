// ============================================
// User Domain Types
// ============================================

import type { SubscriptionTier } from './tenant';

export type UserRole = 'guest' | 'organizer' | 'super_admin';

export interface IUser {
  id: string;
  tenant_id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: UserRole;
  subscription_tier?: SubscriptionTier;
  email_verified: boolean;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
  name: string;
  tenant_id?: string;
  subscription_tier?: SubscriptionTier;
}

export interface IUserUpdate {
  name?: string;
  avatar_url?: string;
  email?: string;
  subscription_tier?: SubscriptionTier;
}
