import dotenv from 'dotenv';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SYSTEM_TENANT_ID =
  process.env.SYSTEM_TENANT_ID || '00000000-0000-0000-0000-000000000000';
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function listAllAuthUsers(
  supabase: {
    auth: {
      admin: {
        listUsers: (input: {
          page: number;
          perPage: number;
        }) => Promise<{
          data: {
            users: Array<{
              id: string;
              email?: string;
              user_metadata?: Record<string, unknown>;
            }>;
          };
          error: { message: string } | null;
        }>;
      };
    };
  }
): Promise<Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }>> {
  const users: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const batch = data.users || [];
    users.push(...batch);

    if (batch.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function main() {
  const client = new Client({
    connectionString: requireEnv('DATABASE_URL', DATABASE_URL),
  });

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  await client.connect();

  try {
    const doomedTenantResult = await client.query<{ id: string; company_name: string }>(
      `
        SELECT id, company_name
        FROM tenants
        WHERE id <> $1
        ORDER BY created_at ASC
      `,
      [SYSTEM_TENANT_ID]
    );

    const doomedTenantIds = doomedTenantResult.rows.map((row) => row.id);

    if (doomedTenantIds.length === 0) {
      console.log('[TENANT_CLEANUP] No customer-facing tenants to delete.');
      return;
    }

    console.log(
      `[TENANT_CLEANUP] Deleting customer-facing tenants: ${doomedTenantResult.rows
        .map((row) => `${row.company_name} (${row.id})`)
        .join(', ')}`
    );

    const doomedUserResult = await client.query<{ id: string; email: string; role: string }>(
      `
        SELECT id, email, role
        FROM users
        WHERE tenant_id = ANY($1::uuid[])
      `,
      [doomedTenantIds]
    );

    const doomedEmails = new Set(
      doomedUserResult.rows.map((row) => row.email.toLowerCase()).filter(Boolean)
    );

    const authUsers = await listAllAuthUsers(supabase);

    for (const authUser of authUsers) {
      const metadataTenantId =
        typeof authUser.user_metadata?.tenant_id === 'string'
          ? authUser.user_metadata.tenant_id
          : undefined;
      const authEmail = (authUser.email || '').toLowerCase();

      const shouldDelete =
        (metadataTenantId && doomedTenantIds.includes(metadataTenantId)) ||
        doomedEmails.has(authEmail);

      if (!shouldDelete) {
        continue;
      }

      console.log(`[TENANT_CLEANUP] Deleting auth user ${authUser.email || authUser.id}`);
      const deleteResult = await supabase.auth.admin.deleteUser(authUser.id);
      if (deleteResult.error) {
        throw new Error(
          `Failed to delete auth user ${authUser.id}: ${deleteResult.error.message}`
        );
      }
    }

    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [doomedTenantIds]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log(
      `[TENANT_CLEANUP] Deleted ${doomedTenantIds.length} tenant(s) and ${doomedUserResult.rows.length} app user(s).`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[TENANT_CLEANUP] Failed:', error);
  process.exit(1);
});
