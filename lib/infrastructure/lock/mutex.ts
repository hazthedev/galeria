// ============================================
// Galeria - Redis Mutex / Idempotency Lock
// ============================================
// Lightweight distributed lock built on Redis SET NX EX.
// Used to prevent duplicate executions of expensive, non-idempotent operations
// (e.g. Lucky Draw executions, billing charges, bulk exports).

import 'server-only';
import { getRedisClient } from '@/lib/infrastructure/cache/redis';

const DEFAULT_TTL_SECONDS = 30;

export interface AcquireLockResult {
    acquired: boolean;
    /** Call this to release the lock early (before TTL expires). */
    release: () => Promise<void>;
}

/**
 * Try to acquire a distributed lock keyed by `lockKey`.
 *
 * Uses Redis SET NX EX — atomic, so concurrent callers are safe.
 * The lock auto-expires after `ttlSeconds` even if release() is never called,
 * preventing deadlocks from crashed handlers.
 *
 * @param lockKey   Unique string identifying the resource being locked.
 * @param ttlSeconds Auto-expiry time in seconds (default 30s).
 * @returns `{ acquired: true, release }` if the lock was obtained,
 *          `{ acquired: false, release: noop }` if already held.
 */
export async function acquireLock(
    lockKey: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<AcquireLockResult> {
    const noop = async () => { /* no-op release for failed acquisitions */ };

    try {
        const redis = getRedisClient();
        // SET key value NX EX ttl — returns 'OK' if set, null if already held
        const result = await redis.set(lockKey, '1', 'EX', ttlSeconds, 'NX');

        if (result !== 'OK') {
            return { acquired: false, release: noop };
        }

        const release = async () => {
            try {
                await redis.del(lockKey);
            } catch (err) {
                console.warn(`[LOCK] Failed to release lock "${lockKey}":`, err);
            }
        };

        return { acquired: true, release };
    } catch (err) {
        // If Redis is unavailable we log a warning but do NOT block the operation.
        // A failed lock acquisition is preferable to a completely broken feature.
        console.warn(`[LOCK] Redis unavailable — skipping lock "${lockKey}":`, err);
        return { acquired: true, release: noop };
    }
}

/**
 * Convenience wrapper — runs `fn` inside a distributed lock.
 * Throws `LockConflictError` if the lock is currently held by another caller.
 */
export class LockConflictError extends Error {
    constructor(lockKey: string) {
        super(`Operation already in progress: ${lockKey}`);
        this.name = 'LockConflictError';
    }
}

export async function withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<T> {
    const { acquired, release } = await acquireLock(lockKey, ttlSeconds);

    if (!acquired) {
        throw new LockConflictError(lockKey);
    }

    try {
        return await fn();
    } finally {
        await release();
    }
}
