import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import Redis from 'ioredis';

const ENV_PATH = process.env.DOTENV_CONFIG_PATH || '.env';
dotenv.config({ path: ENV_PATH });

const SYSTEM_TENANT_ID = process.env.SYSTEM_TENANT_ID || '00000000-0000-0000-0000-000000000000';
const DEFAULT_TENANT_ID = process.env.MASTER_TENANT_ID || '00000000-0000-0000-0000-000000000001';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

type AppSuperAdmin = {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
};

type AuthUserSummary = {
  id: string;
  email: string;
  role: string;
};

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeRole(role: unknown): 'guest' | 'organizer' | 'super_admin' {
  if (role === 'guest' || role === 'organizer' || role === 'super_admin') {
    return role;
  }
  return 'organizer';
}

function generatePassword(): string {
  return crypto.randomBytes(18).toString('base64url');
}

function generateEmail(): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = crypto.randomBytes(4).toString('hex');
  return `superadmin+${stamp}-${suffix}@galeria.local`;
}

async function listAllAuthUsers(supabase: any): Promise<AuthUserSummary[]> {
  const users: AuthUserSummary[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list Supabase auth users: ${error.message}`);
    }

    const batch = data.users || [];
    for (const user of batch) {
      users.push({
        id: user.id,
        email: user.email || '',
        role: normalizeRole(user.user_metadata?.role),
      });
    }

    if (batch.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function resolveTenantId(db: Client): Promise<string> {
  const preferredIds = Array.from(new Set([SYSTEM_TENANT_ID, DEFAULT_TENANT_ID]));

  for (const tenantId of preferredIds) {
    const result = await db.query<{ id: string }>('SELECT id FROM tenants WHERE id = $1 LIMIT 1', [tenantId]);
    if (result.rowCount && result.rows[0]?.id) {
      return result.rows[0].id;
    }
  }

  const masterTenant = await db.query<{ id: string }>(
    "SELECT id FROM tenants WHERE tenant_type = 'master' ORDER BY created_at ASC LIMIT 1"
  );
  if (masterTenant.rowCount && masterTenant.rows[0]?.id) {
    return masterTenant.rows[0].id;
  }

  const anyTenant = await db.query<{ id: string }>('SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1');
  if (anyTenant.rowCount && anyTenant.rows[0]?.id) {
    return anyTenant.rows[0].id;
  }

  throw new Error('No tenant found to attach the new superadmin to');
}

async function listAppSuperAdmins(db: Client): Promise<AppSuperAdmin[]> {
  const result = await db.query<AppSuperAdmin>(
    "SELECT id, tenant_id, email, name FROM users WHERE role = 'super_admin' ORDER BY created_at ASC"
  );
  return result.rows;
}

async function invalidateUserSessions(userIds: string[]): Promise<number> {
  if (!REDIS_URL || userIds.length === 0) {
    return 0;
  }

  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
  const doomed = new Set(userIds);
  const keysToDelete: string[] = [];

  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', '100');
      cursor = nextCursor;

      for (const key of keys) {
        const raw = await redis.get(key);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw) as { userId?: string };
          if (parsed.userId && doomed.has(parsed.userId)) {
            keysToDelete.push(key);
          }
        } catch {
          // Ignore malformed session payloads.
        }
      }
    } while (cursor !== '0');

    if (keysToDelete.length === 0) {
      return 0;
    }

    return await redis.del(...keysToDelete);
  } finally {
    await redis.quit();
  }
}

async function main() {
  const supabase = createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  const db = new Client({ connectionString: requiredEnv('DATABASE_URL', DATABASE_URL) });
  await db.connect();

  try {
    console.log(`[RESET_SUPERADMIN] Using environment file: ${ENV_PATH}`);

    const existingAppSuperAdmins = await listAppSuperAdmins(db);
    const existingAuthUsers = await listAllAuthUsers(supabase);
    const existingAuthSuperAdmins = existingAuthUsers.filter((user) => user.role === 'super_admin');

    const tenantId = await resolveTenantId(db);
    const email = process.env.SUPERADMIN_EMAIL || generateEmail();
    const password = process.env.SUPERADMIN_PASSWORD || generatePassword();
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';

    console.log(`[RESET_SUPERADMIN] Found ${existingAppSuperAdmins.length} app superadmin(s)`);
    console.log(`[RESET_SUPERADMIN] Found ${existingAuthSuperAdmins.length} auth superadmin(s)`);
    console.log(`[RESET_SUPERADMIN] Using tenant ${tenantId}`);
    console.log('[RESET_SUPERADMIN] Creating fresh Supabase auth user...');

    const createResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'super_admin',
        subscription_tier: 'enterprise',
        tenant_id: tenantId,
        email_verified: true,
      },
    });

    if (createResult.error || !createResult.data.user) {
      throw new Error(`Failed to create Supabase auth user: ${createResult.error?.message || 'Unknown error'}`);
    }

    const newAuthUser = createResult.data.user;
    console.log(`[RESET_SUPERADMIN] New auth user created: ${newAuthUser.id}`);

    await db.query('BEGIN');
    try {
      await db.query(
        `INSERT INTO users (
          id,
          tenant_id,
          email,
          password_hash,
          name,
          role,
          subscription_tier,
          email_verified,
          created_at,
          updated_at,
          last_login_at
        ) VALUES ($1, $2, $3, NULL, $4, 'super_admin', 'enterprise', true, NOW(), NOW(), NULL)
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          email = EXCLUDED.email,
          password_hash = NULL,
          name = EXCLUDED.name,
          role = 'super_admin',
          subscription_tier = 'enterprise',
          email_verified = true,
          updated_at = NOW()`,
        [newAuthUser.id, tenantId, email, name]
      );

      const legacyIds = existingAppSuperAdmins
        .map((admin) => admin.id)
        .filter((id) => id !== newAuthUser.id);

      if (legacyIds.length > 0) {
        await db.query(
          `UPDATE users
           SET role = 'guest',
               subscription_tier = 'free',
               updated_at = NOW()
           WHERE id = ANY($1::uuid[])`,
          [legacyIds]
        );
      }

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    const retiredUserIds = existingAppSuperAdmins
      .map((admin) => admin.id)
      .filter((id) => id !== newAuthUser.id);

    const retiredEmails = new Set(
      existingAppSuperAdmins
        .map((admin) => admin.email.toLowerCase())
        .filter((existingEmail) => existingEmail !== email.toLowerCase())
    );

    const authUsersToDelete = existingAuthUsers.filter((user) => {
      if (user.id === newAuthUser.id) {
        return false;
      }

      if (user.role === 'super_admin') {
        return true;
      }

      return Boolean(user.email) && retiredEmails.has(user.email.toLowerCase());
    });

    for (const user of authUsersToDelete) {
      console.log(`[RESET_SUPERADMIN] Deleting old auth user ${user.email || user.id}`);
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        throw new Error(`Failed to delete old auth user ${user.id}: ${error.message}`);
      }
    }

    const invalidatedSessions = await invalidateUserSessions([
      ...retiredUserIds,
      ...authUsersToDelete.map((user) => user.id),
    ]);

    const finalAppSuperAdmins = await listAppSuperAdmins(db);
    const finalAuthUsers = await listAllAuthUsers(supabase);
    const finalAuthSuperAdmins = finalAuthUsers.filter((user) => user.role === 'super_admin');

    console.log('');
    console.log('========================================');
    console.log('SUPERADMIN ROTATED');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Login URL: ${APP_URL.replace(/\/$/, '')}/auth/admin/login`);
    console.log(`Invalidated sessions: ${invalidatedSessions}`);
    console.log(`App superadmins remaining: ${finalAppSuperAdmins.length}`);
    console.log(`Auth superadmins remaining: ${finalAuthSuperAdmins.length}`);
    console.log('========================================');
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('[RESET_SUPERADMIN] Failed:', error);
  process.exit(1);
});
