import 'server-only';

import {
  type AdminIncidentFailureItem,
  type AdminIncidentsData,
  type AdminIncidentServiceStatus,
  type AdminIncidentStatus,
} from '@/lib/domain/admin/types';
import { getAdminDb, isMissingSchemaResourceError } from '@/lib/domain/admin/context';
import { healthCheckRedis } from '@/lib/infrastructure/cache/redis';
import {
  isSupabaseAdminConfigured,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';
import { isRealtimeConfigured } from '@/lib/realtime/server';

async function tableExists(name: string): Promise<boolean> {
  const db = getAdminDb();
  const result = await db.query<{ name: string | null }>(
    'SELECT to_regclass($1) AS name',
    [name]
  );

  return Boolean(result.rows[0]?.name);
}

async function columnExists(tableSchema: string, tableName: string, columnName: string): Promise<boolean> {
  const db = getAdminDb();
  const result = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
          AND column_name = $3
      ) AS exists
    `,
    [tableSchema, tableName, columnName]
  );

  return Boolean(result.rows[0]?.exists);
}

function buildServiceStatus(
  id: string,
  label: string,
  status: AdminIncidentStatus,
  summary: string,
  details: string | null = null,
  latency_ms: number | null = null,
  href: string | null = null
): AdminIncidentServiceStatus {
  return {
    id,
    label,
    status,
    summary,
    details,
    latency_ms,
    href,
  };
}

function getStorageStatus(): AdminIncidentServiceStatus {
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    return buildServiceStatus(
      'storage',
      'Storage',
      'critical',
      'Cloud storage is not fully configured.',
      `Missing env vars: ${missingVars.join(', ')}`,
      null,
      '/admin/settings'
    );
  }

  return buildServiceStatus(
    'storage',
    'Storage',
    'healthy',
    'R2 storage env vars are present.',
    process.env.R2_BUCKET_NAME ? `Bucket: ${process.env.R2_BUCKET_NAME}` : null,
    null,
    '/admin/settings'
  );
}

function getAuthStatus(): AdminIncidentServiceStatus {
  const authConfigured = isSupabaseAuthConfigured();
  const adminConfigured = isSupabaseAdminConfigured();

  if (!authConfigured) {
    return buildServiceStatus(
      'auth',
      'Auth',
      'critical',
      'Supabase auth is not configured.',
      'Password resets, auth recovery, and realtime auth handshakes may fail.',
      null,
      '/admin/settings'
    );
  }

  if (!adminConfigured) {
    return buildServiceStatus(
      'auth',
      'Auth',
      'warning',
      'Supabase auth is available, but admin credentials are incomplete.',
      'Privileged flows that depend on service-role access may be degraded.',
      null,
      '/admin/settings'
    );
  }

  return buildServiceStatus(
    'auth',
    'Auth',
    'healthy',
    'Supabase auth and admin credentials are configured.',
    null,
    null,
    '/admin/settings'
  );
}

function getRealtimeStatus(): AdminIncidentServiceStatus {
  if (!isRealtimeConfigured()) {
    return buildServiceStatus(
      'realtime',
      'Realtime',
      'warning',
      'Realtime broadcasts are not fully configured.',
      'Live gallery and lucky draw updates may be delayed until page refresh.',
      null,
      '/admin/settings'
    );
  }

  return buildServiceStatus(
    'realtime',
    'Realtime',
    'healthy',
    'Realtime broadcast credentials are configured.',
    null,
    null,
    '/admin/settings'
  );
}

function getModerationQueueStatus(): AdminIncidentServiceStatus {
  const queueEnabled = process.env.MODERATION_QUEUE_ENABLED === 'true';

  if (!queueEnabled) {
    return buildServiceStatus(
      'moderation_queue',
      'Moderation Queue',
      'warning',
      'Manual moderation queue is disabled.',
      'Organizers can still moderate photos manually from the event admin panel.',
      null,
      '/admin/moderation'
    );
  }

  return buildServiceStatus(
    'moderation_queue',
    'Moderation Queue',
    'healthy',
    'Moderation queue is enabled.',
    'Queue is enabled for manual moderation workflows.',
    null,
    '/admin/moderation'
  );
}

export function getEmptyAdminIncidentsData(): AdminIncidentsData {
  return {
    summary: {
      critical_services: 0,
      warning_services: 0,
      pending_moderation: 0,
      active_events: 0,
      admin_mfa_gaps: 0,
      failed_scans_24h: 0,
      failed_admin_actions_24h: 0,
    },
    services: [
      buildServiceStatus(
        'database',
        'Database',
        'warning',
        'Incident metrics are unavailable.',
        'The admin incidents workspace is using fallback data because some schema resources are missing.',
        null
      ),
      getAuthStatus(),
      getRealtimeStatus(),
      getStorageStatus(),
      getModerationQueueStatus(),
    ],
    recentFailures: [],
  };
}

export async function getAdminIncidents(): Promise<AdminIncidentsData> {
  const db = getAdminDb();
  const [hasPhotoScanLogs, hasAdminAuditLogs, hasTotpEnabledColumn] = await Promise.all([
    tableExists('public.photo_scan_logs'),
    tableExists('public.admin_audit_logs'),
    columnExists('public', 'users', 'totp_enabled'),
  ]);

  const [dbStatus, redisStatus, summaryResult, recentFailures] = await Promise.all([
    (async () => {
      const start = Date.now();
      try {
        await db.query('SELECT 1');
        return buildServiceStatus(
          'database',
          'Database',
          'healthy',
          'Primary database connection is healthy.',
          null,
          Date.now() - start
        );
      } catch (error) {
        return buildServiceStatus(
          'database',
          'Database',
          'critical',
          'Primary database connection failed.',
          error instanceof Error ? error.message : 'Unknown database error',
          null
        );
      }
    })(),
    (async () => {
      const result = await healthCheckRedis();
      return result.healthy
        ? buildServiceStatus(
            'redis',
            'Redis',
            'healthy',
            'Redis is reachable for sessions and rate limits.',
            `Client status: ${result.status}`,
            result.latency
          )
        : buildServiceStatus(
            'redis',
            'Redis',
            'critical',
            'Redis health check failed.',
            `Client status: ${result.status}`,
            null
        );
    })(),
    (async () => {
      try {
        return await db.query<{
          pending_moderation: string;
          active_events: string;
          admin_mfa_gaps: string;
          failed_scans_24h: string;
          failed_admin_actions_24h: string;
        }>(`
          SELECT
            (SELECT COUNT(*) FROM photos WHERE status = 'pending') AS pending_moderation,
            (SELECT COUNT(*) FROM events WHERE status = 'active') AS active_events,
            ${
              hasTotpEnabledColumn
                ? `(SELECT COUNT(*) FROM users WHERE totp_enabled = false AND role = 'super_admin')`
                : '0'
            } AS admin_mfa_gaps,
            ${
              hasPhotoScanLogs
                ? `(SELECT COUNT(*) FROM photo_scan_logs
                    WHERE created_at >= NOW() - INTERVAL '24 hours'
                      AND (outcome = 'failed' OR decision = 'error'))`
                : '0'
            } AS failed_scans_24h,
            ${
              hasAdminAuditLogs
                ? `(SELECT COUNT(*) FROM admin_audit_logs
                    WHERE created_at >= NOW() - INTERVAL '24 hours'
                      AND action LIKE '%.failed')`
                : '0'
            } AS failed_admin_actions_24h
        `);
      } catch (error) {
        if (!isMissingSchemaResourceError(error)) {
          throw error;
        }

        return {
          rows: [
            {
              pending_moderation: '0',
              active_events: '0',
              admin_mfa_gaps: '0',
              failed_scans_24h: '0',
              failed_admin_actions_24h: '0',
            },
          ],
        };
      }
    })(),
    (async (): Promise<AdminIncidentFailureItem[]> => {
      const failureItems: AdminIncidentFailureItem[] = [];

      if (hasPhotoScanLogs) {
        try {
          const scanFailures = await db.query<{
            id: string;
            photo_id: string | null;
            event_id: string;
            event_name: string | null;
            created_at: Date | string;
            reason: string | null;
            error: string | null;
          }>(
            `
              SELECT
                l.id,
                l.photo_id,
                l.event_id,
                e.name AS event_name,
                l.created_at,
                l.reason,
                l.error
              FROM photo_scan_logs l
              LEFT JOIN events e ON e.id = l.event_id
              WHERE l.created_at >= NOW() - INTERVAL '24 hours'
                AND (l.outcome = 'failed' OR l.decision = 'error')
              ORDER BY l.created_at DESC
              LIMIT 5
            `
          );

          failureItems.push(
            ...scanFailures.rows.map((row) => ({
              id: `scan-${row.id}`,
              type: 'scan_failure' as const,
              title: row.event_name
                ? `Scan failure in ${row.event_name}`
                : 'Photo scan failure',
              description: row.error || row.reason || 'The moderation scan did not complete successfully.',
              created_at:
                typeof row.created_at === 'string'
                  ? new Date(row.created_at).toISOString()
                  : row.created_at.toISOString(),
              href: row.event_id ? `/admin/events/${row.event_id}` : '/admin/moderation',
            }))
          );
        } catch (error) {
          if (!isMissingSchemaResourceError(error)) {
            throw error;
          }
        }
      }

      if (hasAdminAuditLogs) {
        try {
          const adminFailures = await db.query<{
            id: string;
            action: string;
            target_type: string | null;
            target_id: string | null;
            created_at: Date | string;
            reason: string | null;
            new_values: Record<string, unknown> | null;
          }>(
            `
              SELECT
                id,
                action,
                target_type,
                target_id,
                created_at,
                reason,
                new_values
              FROM admin_audit_logs
              WHERE created_at >= NOW() - INTERVAL '24 hours'
                AND action LIKE '%.failed'
              ORDER BY created_at DESC
              LIMIT 5
            `
          );

          failureItems.push(
            ...adminFailures.rows.map((row) => {
              const errorValue =
                row.new_values && typeof row.new_values.error === 'string'
                  ? row.new_values.error
                  : null;

              let href: string | null = '/admin/audit';
              if (row.target_type === 'event' && row.target_id) {
                href = `/admin/events/${row.target_id}`;
              } else if (row.target_type === 'tenant' && row.target_id) {
                href = `/admin/tenants/${row.target_id}`;
              } else if (row.target_type === 'user' && row.target_id) {
                href = `/admin/users/${row.target_id}`;
              }

              return {
                id: `audit-${row.id}`,
                type: 'admin_action_failure' as const,
                title: `Admin action failed: ${row.action.replace('.failed', '')}`,
                description: errorValue || row.reason || 'A privileged admin action failed.',
                created_at:
                  typeof row.created_at === 'string'
                    ? new Date(row.created_at).toISOString()
                    : row.created_at.toISOString(),
                href,
              };
            })
          );
        } catch (error) {
          if (!isMissingSchemaResourceError(error)) {
            throw error;
          }
        }
      }

      return failureItems
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .slice(0, 8);
    })(),
  ]);

  const services = [
    dbStatus,
    redisStatus,
    getAuthStatus(),
    getRealtimeStatus(),
    getStorageStatus(),
    getModerationQueueStatus(),
  ];

  const summaryRow = summaryResult.rows[0];
  const critical_services = services.filter((service) => service.status === 'critical').length;
  const warning_services = services.filter((service) => service.status === 'warning').length;

  return {
    summary: {
      critical_services,
      warning_services,
      pending_moderation: Number(summaryRow?.pending_moderation || 0),
      active_events: Number(summaryRow?.active_events || 0),
      admin_mfa_gaps: Number(summaryRow?.admin_mfa_gaps || 0),
      failed_scans_24h: Number(summaryRow?.failed_scans_24h || 0),
      failed_admin_actions_24h: Number(summaryRow?.failed_admin_actions_24h || 0),
    },
    services,
    recentFailures,
  };
}
