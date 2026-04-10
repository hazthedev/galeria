// ============================================
// Galeria - Database Configuration
// ============================================
// Multi-tenant PostgreSQL with Row-Level Security

import 'server-only';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import type { ITenant } from '@/lib/types';

// ============================================
// CONFIGURATION
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const defaultPoolMin = isProduction ? 0 : 2;
const defaultPoolMax = isProduction ? 1 : 20;

const configuredPoolMin = parseInt(process.env.DATABASE_POOL_MIN || `${defaultPoolMin}`, 10);
const configuredPoolMax = parseInt(process.env.DATABASE_POOL_MAX || `${defaultPoolMax}`, 10);
const normalizedPoolMax = Number.isFinite(configuredPoolMax) ? Math.max(1, configuredPoolMax) : defaultPoolMax;
const normalizedPoolMinRaw = Number.isFinite(configuredPoolMin) ? Math.max(0, configuredPoolMin) : defaultPoolMin;
const normalizedPoolMin = Math.min(normalizedPoolMinRaw, normalizedPoolMax);

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: normalizedPoolMin,
  max: normalizedPoolMax,
  idleTimeoutMillis: isProduction ? 2000 : 30000,
  connectionTimeoutMillis: 30000,  // Increased from 2000ms to 30s
  statement_timeout: 60000,  // 60 second query timeout
  query_timeout: 60000,  // 60 second query timeout
  allowExitOnIdle: true,
};

const RETRYABLE_DB_ERROR_MESSAGES = [
  'MaxClientsInSessionMode',
  'too many clients already',
];

const DB_RETRY_MAX_ATTEMPTS = parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '2', 10);
const DB_RETRY_BASE_DELAY_MS = parseInt(process.env.DB_RETRY_BASE_DELAY_MS || '120', 10);
const DB_RETRY_MAX_ATTEMPTS_SESSION_MODE = parseInt(
  process.env.DB_RETRY_MAX_ATTEMPTS_SESSION_MODE || '1',
  10
);

const SET_TENANT_CONTEXT_SQL = 'SELECT set_tenant_id($1::uuid)';

function isSessionModeClientLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeMessage = 'message' in error ? String(error.message || '') : '';
  return maybeMessage.includes('MaxClientsInSessionMode');
}

function isRetryableDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeMessage = 'message' in error ? String(error.message || '') : '';
  const maybeCode = 'code' in error ? String(error.code || '') : '';

  return (
    maybeCode === 'XX000' ||
    RETRYABLE_DB_ERROR_MESSAGES.some((fragment) => maybeMessage.includes(fragment))
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// SQL IDENTIFIER ESCAPING
// ============================================

/**
 * Escape a SQL identifier to prevent SQL injection.
 * PostgreSQL identifiers are escaped by wrapping in double quotes
 * and doubling any double quotes within the identifier.
 *
 * This function also validates that the identifier contains only
 * valid characters (letters, numbers, underscores, and periods).
 *
 * @param identifier - The table or column name to escape
 * @returns The escaped, safe-to-use identifier
 * @throws Error if the identifier contains invalid characters
 */
function escapeIdentifier(identifier: string): string {
  // Validate identifier contains only safe characters
  // PostgreSQL identifiers can contain: letters, numbers, underscores, and periods
  // We're being conservative and only allowing what we use in our schema
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  // Escape by wrapping in double quotes and doubling any internal quotes
  return `"${identifier.replace(/"/g, '""')}"`;
}

// Create connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
      // Don't exit in production - let the application handle it
      // The pool will automatically create a new connection
    });
  }

  return pool;
}

// ============================================
// DATABASE CLASS
// ============================================

export class TenantDatabase {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Execute a query with tenant isolation
   * IMPORTANT: This properly manages connection checkout/release
   * to ensure set_tenant_id and the actual query run on the SAME connection.
   */
  async query<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const pool = getPool();

    for (let attempt = 1; attempt <= DB_RETRY_MAX_ATTEMPTS; attempt++) {
      let client: PoolClient | null = null;

      try {
        client = await pool.connect();

        // Set tenant context for THIS connection
        await client.query(SET_TENANT_CONTEXT_SQL, [this.tenantId]);

        // Execute the query on the SAME connection
        const result = await client.query(text, params);
        return result;
      } catch (error) {
        const retryable = isRetryableDbConnectionError(error);
        const maxAttemptsForError = isSessionModeClientLimitError(error)
          ? Math.max(1, Math.min(DB_RETRY_MAX_ATTEMPTS, DB_RETRY_MAX_ATTEMPTS_SESSION_MODE))
          : DB_RETRY_MAX_ATTEMPTS;
        const isFinalAttempt = attempt >= maxAttemptsForError;

        console.error('[DB] Query error:', {
          attempt,
          retryable,
          maxAttemptsForError,
          code: typeof error === 'object' && error && 'code' in error ? error.code : undefined,
          message: error instanceof Error ? error.message : String(error),
        });

        if (!retryable || isFinalAttempt) {
          throw error;
        }

        await sleep(DB_RETRY_BASE_DELAY_MS * attempt);
      } finally {
        // In production serverless, destroy clients on release to avoid
        // holding session-mode pool slots across warm invocations.
        if (client) {
          client.release(isProduction);
        }
      }
    }

    throw new Error('Database query failed after retries');
  }

  /**
   * Get a connection from the pool
   * WARNING: You MUST call client.release() when done!
   * Consider using query() or transact() instead for automatic connection management.
   *
   * @example
   * const client = await db.getClient();
   * try {
   *   await client.query('SELECT set_tenant_id($1)', [tenantId]);
   *   // Do multiple operations...
   * } finally {
   *   client.release(); // IMPORTANT!
   * }
   */
  async getClient(): Promise<PoolClient> {
    const pool = getPool();
    return await pool.connect();
  }

  /**
   * Execute multiple queries in a transaction with automatic connection management
   * @param callback Function that receives the client and should return the result
   * @returns The result of the callback function
   * @example
   * const result = await db.transact(async (client) => {
   *   await client.query('INSERT INTO users ...');
   *   await client.query('UPDATE events ...');
   *   return { success: true };
   * });
   */
  async transact<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Set tenant context
      await client.query(SET_TENANT_CONTEXT_SQL, [this.tenantId]);

      // Begin transaction
      await client.query('BEGIN');

      // Execute callback
      const result = await callback(client);

      // Commit transaction
      await client.query('COMMIT');

      return result;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('[DB] Transaction error, rolled back:', error);
      throw error;
    } finally {
      // Always release connection
      client.release(isProduction);
    }
  }

  /**
   * Find a single record
   */
  async findOne<T extends QueryResultRow>(
    table: string,
    conditions: Record<string, unknown>
  ): Promise<T | null> {
    // Escape table name to prevent SQL injection
    const safeTable = escapeIdentifier(table);

    // Build query with escaped column names
    const conditionsStr = Object.entries(conditions)
      .map(([key, value], index) => `${escapeIdentifier(key)} = $${index + 1}`)
      .join(' AND ');

    const query = `SELECT * FROM ${safeTable} WHERE ${conditionsStr} LIMIT 1`;

    const result = await this.query<T>(query, Object.values(conditions));

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Find multiple records
   */
  async findMany<T extends QueryResultRow>(
    table: string,
    conditions?: Record<string, unknown>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<T[]> {
    // Escape table name to prevent SQL injection
    const safeTable = escapeIdentifier(table);

    let query = `SELECT * FROM ${safeTable}`;
    const values: unknown[] = [];
    let paramIndex = 1;

    if (conditions && Object.keys(conditions).length > 0) {
      const conditionsStr = Object.entries(conditions)
        .map(([key, value]) => {
          const placeholder = `$${paramIndex}`;
          paramIndex++;
          values.push(value);
          return `${escapeIdentifier(key)} = ${placeholder}`;
        })
        .join(' AND ');

      query += ` WHERE ${conditionsStr}`;
    }

    if (options?.orderBy) {
      const direction = options.orderDirection || 'ASC';
      query += ` ORDER BY ${escapeIdentifier(options.orderBy)} ${direction}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
      paramIndex++;
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(options.offset);
    }

    const result = await this.query<T>(query, values);

    return result.rows;
  }

  /**
   * Insert a record
   */
  async insert<T extends QueryResultRow = QueryResultRow>(
    table: string,
    data: Record<string, unknown>
  ): Promise<T> {
    // Escape table and column names to prevent SQL injection
    const safeTable = escapeIdentifier(table);
    const columns = Object.keys(data).map(k => escapeIdentifier(k));
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${safeTable} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query<T>(query, values);

    return result.rows[0];
  }

  /**
   * Update records
   */
  async update(
    table: string,
    data: Record<string, unknown>,
    conditions: Record<string, unknown>
  ): Promise<void> {
    // Escape table and column names to prevent SQL injection
    const safeTable = escapeIdentifier(table);
    const dataEntries = Object.entries(data);
    const conditionEntries = Object.entries(conditions);

    // Build SET clause with escaped identifiers
    const setClause = dataEntries
      .map(([key], index) => `${escapeIdentifier(key)} = $${index + 1}`)
      .join(', ');

    // Build WHERE clause with escaped identifiers
    const conditionsStr = conditionEntries
      .map(([key], index) => `${escapeIdentifier(key)} = $${dataEntries.length + index + 1}`)
      .join(' AND ');

    const query = `
      UPDATE ${safeTable}
      SET ${setClause}
      WHERE ${conditionsStr}
    `;

    const values = [...dataEntries.map(([, value]) => value), ...conditionEntries.map(([, value]) => value)];

    await this.query(query, values);
  }

  /**
   * Delete records
   */
  async delete(
    table: string,
    conditions: Record<string, unknown>
  ): Promise<number> {

    // Escape table and column names to prevent SQL injection
    const safeTable = escapeIdentifier(table);

    // Build WHERE clause with escaped identifiers
    const conditionsStr = Object.entries(conditions)
      .map(([key, value], index) => `${escapeIdentifier(key)} = $${index + 1}`)
      .join(' AND ');

    const query = `DELETE FROM ${safeTable} WHERE ${conditionsStr}`;
    const values = Object.values(conditions);

    const result = await this.query(query, values);
    return result.rowCount || 0;
  }

  /**
   * Count records
   */
  async count(
    table: string,
    conditions?: Record<string, unknown>
  ): Promise<number> {
    // Escape table name to prevent SQL injection
    const safeTable = escapeIdentifier(table);

    let query = `SELECT COUNT(*) as count FROM ${safeTable}`;
    const values: unknown[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const conditionsStr = Object.entries(conditions)
        .map(([key, value], index) => `${escapeIdentifier(key)} = $${index + 1}`)
        .join(' AND ');

      query += ` WHERE ${conditionsStr}`;
      values.push(...Object.values(conditions));
    }

    const result = await this.query<{ count: bigint }>(query, values);
    return Number(result.rows[0].count);
  }
}

// ============================================
// TENANT CONTEXT
// ============================================

/**
 * Get a tenant-aware database instance
 */
export function getTenantDb(tenantId: string): TenantDatabase {
  return new TenantDatabase(tenantId);
}

/**
 * Execute a query with tenant context (for direct pool access)
 */
export async function queryWithTenant<T extends QueryResultRow = QueryResultRow>(
  tenantId: string,
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(SET_TENANT_CONTEXT_SQL, [tenantId]);
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release(isProduction);
  }
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Get migration version
 */
export async function getMigrationVersion(pool: Pool): Promise<number> {
  const result = await pool.query('SELECT version FROM migration_version LIMIT 1');
  return result.rows[0]?.version || 0;
}

/**
 * Set migration version
 */
export async function setMigrationVersion(pool: Pool, version: number): Promise<void> {
  await pool.query('UPDATE migration_version SET version = $1', [version]);
}

/**
 * Close connection pool gracefully
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Graceful shutdown (Node.js only, not Edge Runtime)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGINT', async () => {
    await closePool();
    if (process.exit) process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closePool();
    if (process.exit) process.exit(0);
  });
}
