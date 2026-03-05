import 'server-only';

import type { IUser, SubscriptionTier, UserRole } from '@/lib/types';
import { DEFAULT_TENANT_ID } from '@/lib/constants/tenants';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/infrastructure/auth/supabase-server';

type SupabaseAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

function normalizeRole(role: unknown): UserRole {
  if (role === 'guest' || role === 'organizer' || role === 'super_admin') {
    return role;
  }
  return 'organizer';
}

function normalizeTier(tier: unknown): SubscriptionTier {
  if (tier === 'free' || tier === 'pro' || tier === 'premium' || tier === 'enterprise' || tier === 'tester') {
    return tier;
  }
  return 'free';
}

function toAppUserFromRecord(record: Record<string, unknown>): IUser {
  return {
    id: String(record.id),
    tenant_id: String(record.tenant_id),
    email: String(record.email || ''),
    name: String(record.name || 'User'),
    role: normalizeRole(record.role),
    subscription_tier: normalizeTier(record.subscription_tier),
    email_verified: Boolean(record.email_verified),
    created_at: record.created_at ? new Date(String(record.created_at)) : new Date(),
    updated_at: record.updated_at ? new Date(String(record.updated_at)) : new Date(),
    last_login_at: record.last_login_at ? new Date(String(record.last_login_at)) : undefined,
  };
}

function toFallbackAppUser(user: SupabaseAuthUser): IUser {
  const metadata = user.user_metadata || {};
  const now = new Date();
  return {
    id: user.id,
    tenant_id: typeof metadata.tenant_id === 'string' ? metadata.tenant_id : DEFAULT_TENANT_ID,
    email: user.email || '',
    name: typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : 'User',
    role: normalizeRole(metadata.role),
    subscription_tier: normalizeTier(metadata.subscription_tier),
    email_verified: Boolean(user.email_confirmed_at),
    created_at: user.created_at ? new Date(user.created_at) : now,
    updated_at: user.updated_at ? new Date(user.updated_at) : now,
  };
}

export async function resolveOrProvisionAppUser(user: SupabaseAuthUser): Promise<IUser> {
  if (!user.email) {
    throw new Error('Supabase user has no email');
  }

  if (!isSupabaseAdminConfigured()) {
    return toFallbackAppUser(user);
  }

  const metadata = user.user_metadata || {};
  const tenantId = typeof metadata.tenant_id === 'string' ? metadata.tenant_id : DEFAULT_TENANT_ID;
  const name = typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : 'User';
  const role = normalizeRole(metadata.role);
  const subscriptionTier = normalizeTier(metadata.subscription_tier);
  const emailVerified = Boolean(user.email_confirmed_at);

  const supabase = getSupabaseAdminClient();

  // Reuse existing row by tenant+email if it exists (legacy/local users compatibility).
  const existingQuery = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('email', user.email)
    .maybeSingle();

  if (existingQuery.error) {
    throw new Error(`Failed to query app user profile: ${existingQuery.error.message}`);
  }

  if (existingQuery.data) {
    const existing = existingQuery.data as Record<string, unknown>;
    const existingId = String(existing.id);
    const updates: Record<string, unknown> = {
      name,
      role,
      subscription_tier: subscriptionTier,
      email_verified: emailVerified,
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };

    const updateResult = await supabase
      .from('users')
      .update(updates)
      .eq('id', existingId);

    if (updateResult.error) {
      throw new Error(`Failed to update app user profile: ${updateResult.error.message}`);
    }

    return toAppUserFromRecord({
      ...existing,
      ...updates,
      id: existingId,
      tenant_id: tenantId,
      email: user.email,
    });
  }

  const insertPayload: Record<string, unknown> = {
    id: user.id,
    tenant_id: tenantId,
    email: user.email,
    password_hash: null,
    name,
    role,
    subscription_tier: subscriptionTier,
    email_verified: emailVerified,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  const insertResult = await supabase
    .from('users')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertResult.error) {
    throw new Error(`Failed to create app user profile: ${insertResult.error.message}`);
  }

  return toAppUserFromRecord(insertResult.data as Record<string, unknown>);
}
