// ============================================
// Galeria - Lucky Draw Core Logic
// ============================================
// Core lucky draw functionality including draw execution algorithm and entry management

import 'server-only';

import { getTenantDb } from '@/lib/db';
import type { PoolClient, QueryResultRow } from 'pg';
import type {
  LuckyDrawConfig,
  NewLuckyDrawConfig,
  LuckyDrawEntry,
  NewLuckyDrawEntry,
  Winner,
  NewWinner,
  DrawStatus,
  PrizeTier
} from '@/lib/types';
import { getEffectiveTenantEntitlements } from '@/lib/domain/tenant/entitlements';

import crypto from 'crypto';

type LuckyDrawQueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<{
    rows: T[];
    rowCount: number | null;
  }>;
};

const luckyDrawConfigColumns = `
  id,
  event_id AS "eventId",
  prize_tiers AS "prizeTiers",
  max_entries_per_user AS "maxEntriesPerUser",
  require_photo_upload AS "requirePhotoUpload",
  prevent_duplicate_winners AS "preventDuplicateWinners",
  scheduled_at AS "scheduledAt",
  status,
  completed_at AS "completedAt",
  animation_style AS "animationStyle",
  animation_duration AS "animationDuration",
  show_selfie AS "showSelfie",
  show_full_name AS "showFullName",
  play_sound AS "playSound",
  confetti_animation AS "confettiAnimation",
  total_entries AS "totalEntries",
  created_by AS "createdBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const luckyDrawEntryColumns = `
  id,
  event_id AS "eventId",
  config_id AS "configId",
  photo_id AS "photoId",
  user_fingerprint AS "userFingerprint",
  participant_name AS "participantName",
  is_winner AS "isWinner",
  prize_tier AS "prizeTier",
  created_at AS "createdAt"
`;

const winnerColumns = `
  id,
  event_id AS "eventId",
  entry_id AS "entryId",
  participant_name AS "participantName",
  selfie_url AS "selfieUrl",
  prize_tier AS "prizeTier",
  prize_name AS "prizeName",
  prize_description AS "prizeDescription",
  selection_order AS "selectionOrder",
  is_claimed AS "isClaimed",
  drawn_at AS "drawnAt",
  notified_at AS "notifiedAt",
  created_at AS "createdAt"
`;

/**
 * Generate a random UUID v4
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

async function getLuckyDrawEntitlementsOrThrow(tenantId: string) {
  const entitlements = await getEffectiveTenantEntitlements(tenantId);
  if (!entitlements.features.lucky_draw) {
    throw new Error('Lucky Draw is not available on your current plan');
  }

  return entitlements;
}

async function assertTotalEntryCapacity(
  executor: LuckyDrawQueryExecutor,
  configId: string,
  maxEntriesPerEvent: number,
  requestedEntries: number
): Promise<void> {
  if (maxEntriesPerEvent === -1) {
    return;
  }

  const entryCountResult = await executor.query<{ count: bigint }>(`
    SELECT COUNT(*) as count
    FROM lucky_draw_entries
    WHERE config_id = $1
  `, [configId]);
  const entryCount = Number(entryCountResult.rows[0]?.count || 0);

  if (entryCount + requestedEntries > maxEntriesPerEvent) {
    throw new Error(`Draw entry limit reached (${maxEntriesPerEvent})`);
  }
}

async function acquireLuckyDrawEventLock(
  client: PoolClient,
  tenantId: string,
  eventId: string
): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
    tenantId,
    eventId,
  ]);
}

async function syncConfigEntryCount(
  executor: LuckyDrawQueryExecutor,
  configId: string
): Promise<void> {
  await executor.query(
    `
      UPDATE lucky_draw_configs
      SET total_entries = (
        SELECT COUNT(*)
        FROM lucky_draw_entries
        WHERE config_id = $1
      ),
      updated_at = NOW()
      WHERE id = $1
    `,
    [configId]
  );
}

async function getConfigById(
  executor: LuckyDrawQueryExecutor,
  configId: string,
  options?: {
    eventId?: string;
    forUpdate?: boolean;
  }
): Promise<LuckyDrawConfig | null> {
  const conditions = ['id = $1'];
  const params: unknown[] = [configId];

  if (options?.eventId) {
    conditions.push(`event_id = $${params.length + 1}`);
    params.push(options.eventId);
  }

  const result = await executor.query<LuckyDrawConfig>(
    `
      SELECT ${luckyDrawConfigColumns}
      FROM lucky_draw_configs
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT 1
      ${options?.forUpdate ? 'FOR UPDATE' : ''}
    `,
    params
  );

  return result.rows[0] || null;
}

async function getScheduledConfigForEvent(
  executor: LuckyDrawQueryExecutor,
  eventId: string,
  options?: {
    forUpdate?: boolean;
  }
): Promise<LuckyDrawConfig | null> {
  const result = await executor.query<LuckyDrawConfig>(
    `
      SELECT ${luckyDrawConfigColumns}
      FROM lucky_draw_configs
      WHERE event_id = $1 AND status = 'scheduled'
      ORDER BY created_at DESC
      LIMIT 1
      ${options?.forUpdate ? 'FOR UPDATE' : ''}
    `,
    [eventId]
  );

  return result.rows[0] || null;
}

type LuckyDrawEntryCandidate = LuckyDrawEntry & {
  photoStatus: 'pending' | 'approved' | 'rejected' | null;
};

async function getEligibleEntryCandidates(
  executor: LuckyDrawQueryExecutor,
  configId: string
): Promise<LuckyDrawEntryCandidate[]> {
  const result = await executor.query<LuckyDrawEntryCandidate>(
    `
      SELECT
        ${luckyDrawEntryColumns},
        p.status AS "photoStatus"
      FROM lucky_draw_entries le
      LEFT JOIN photos p ON p.id = le.photo_id
      WHERE le.config_id = $1
        AND le.is_winner = false
      ORDER BY le.created_at ASC
    `,
    [configId]
  );

  return result.rows;
}

export function isLuckyDrawPhotoStatusEligible(
  photoStatus: 'pending' | 'approved' | 'rejected' | null | undefined,
  photoId?: string | null
): boolean {
  if (!photoId) {
    return true;
  }

  return photoStatus === 'approved';
}

export function filterEligibleLuckyDrawEntries<
  T extends {
    photoId?: string | null;
    photoStatus?: 'pending' | 'approved' | 'rejected' | null;
  }
>(entries: T[]): T[] {
  return entries.filter((entry) => isLuckyDrawPhotoStatusEligible(entry.photoStatus, entry.photoId));
}

export function filterEligibleRedrawEntries<
  T extends {
    id: string;
    userFingerprint: string;
    photoId?: string | null;
    photoStatus?: 'pending' | 'approved' | 'rejected' | null;
  }
>(
  entries: T[],
  excludedFingerprints: Set<string>,
  excludedEntryIds: Set<string>
): T[] {
  return filterEligibleLuckyDrawEntries(entries).filter(
    (entry) =>
      !excludedEntryIds.has(entry.id) &&
      !excludedFingerprints.has(entry.userFingerprint)
  );
}

const prizeTierOrder: Record<PrizeTier, number> = {
  grand: 0,
  first: 1,
  second: 2,
  third: 3,
  consolation: 4,
};

export function sortPrizeTiers(
  prizeTiers: LuckyDrawConfig['prizeTiers']
): LuckyDrawConfig['prizeTiers'] {
  return [...prizeTiers].sort(
    (a, b) => (prizeTierOrder[a.tier] ?? 999) - (prizeTierOrder[b.tier] ?? 999)
  );
}

export function buildRedrawPrizeDescription(
  description?: string | null,
  reason?: string | null
): string {
  const base = description?.trim() || '';
  const note = reason?.trim() ? `[REDRAW: ${reason.trim()}]` : '[REDRAW]';

  return base ? `${base} ${note}` : note;
}

// ============================================
// FISHER-YATES SHUFFLE ALGORITHM
// ============================================

/**
 * Shuffles array using Fisher-Yates algorithm
 * Time complexity: O(n), Space complexity: O(n)
 * Uses crypto.randomInt for cryptographic randomness
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a random string for testing/reproducible draws
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// ============================================
// LUCKY DRAW CONFIG
// ============================================

/**
 * Create a new lucky draw configuration for an event
 */
export async function createLuckyDrawConfig(
  tenantId: string,
  eventId: string,
  config: NewLuckyDrawConfig
): Promise<LuckyDrawConfig> {
  await getLuckyDrawEntitlementsOrThrow(tenantId);
  const db = getTenantDb(tenantId);

  const now = new Date();

  const result = await db.query<LuckyDrawConfig>(`
    INSERT INTO lucky_draw_configs (
      event_id,
      prize_tiers,
      max_entries_per_user,
      require_photo_upload,
      prevent_duplicate_winners,
      scheduled_at,
      status,
      completed_at,
      animation_style,
      animation_duration,
      show_selfie,
      show_full_name,
      play_sound,
      confetti_animation,
      total_entries,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2::json, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
    RETURNING ${luckyDrawConfigColumns}
  `, [
    eventId,
    JSON.stringify(config.prizeTiers),
    config.maxEntriesPerUser ?? 1,
    config.requirePhotoUpload ?? true,
    config.preventDuplicateWinners ?? true,
    config.scheduledAt ?? null,
    'scheduled',
    config.completedAt ?? null,
    config.animationStyle ?? 'spinning_wheel',
    config.animationDuration ?? 8,
    config.showSelfie ?? true,
    config.showFullName ?? true,
    config.playSound ?? true,
    config.confettiAnimation ?? true,
    0,
    config.createdBy ?? null,
    now,
    now,
  ]);

  return result.rows[0];
}

/**
 * Get the active configuration for an event
 */
export async function getActiveConfig(
  tenantId: string,
  eventId: string
): Promise<LuckyDrawConfig | null> {
  const db = getTenantDb(tenantId);
  return getScheduledConfigForEvent(db, eventId);
}

/**
 * Get the most recent configuration for an event.
 * Prioritizes 'scheduled' configs (active draft) over completed/cancelled ones.
 * If no scheduled config exists, returns the most recent config of any status.
 */
export async function getLatestConfig(
  tenantId: string,
  eventId: string
): Promise<LuckyDrawConfig | null> {
  const db = getTenantDb(tenantId);

  // First try to get the most recent scheduled config (active draft)
  const scheduledResult = await db.query<LuckyDrawConfig>(`
    SELECT ${luckyDrawConfigColumns}
    FROM lucky_draw_configs
    WHERE event_id = $1 AND status = 'scheduled'
    ORDER BY created_at DESC
    LIMIT 1
  `, [eventId]);

  if (scheduledResult.rows[0]) {
    return scheduledResult.rows[0];
  }

  // Fallback: return the most recent config of any status
  const result = await db.query<LuckyDrawConfig>(`
    SELECT ${luckyDrawConfigColumns}
    FROM lucky_draw_configs
    WHERE event_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [eventId]);

  return result.rows[0] || null;
}

// ============================================
// LUCKY DRAW ENTRIES
// ============================================

/**
 * Create a lucky draw entry (auto-created from photo upload)
 */
export async function createEntryFromPhoto(
  tenantId: string,
  eventId: string,
  photoId: string,
  userFingerprint: string,
  participantName?: string,
  options?: {
    maxEntriesPerEvent?: number;
  }
): Promise<LuckyDrawEntry> {
  const db = getTenantDb(tenantId);
  const maxEntriesPerEvent = options?.maxEntriesPerEvent ?? (
    await getLuckyDrawEntitlementsOrThrow(tenantId)
  ).limits.max_draw_entries_per_event;

  return db.transact<LuckyDrawEntry>(async (client) => {
    await acquireLuckyDrawEventLock(client, tenantId, eventId);

    const config = await getScheduledConfigForEvent(client, eventId, { forUpdate: true });
    if (!config) {
      throw new Error('No active draw configuration found for this event');
    }

    const userEntryCountResult = await client.query<{ count: bigint }>(
      `
        SELECT COUNT(*) as count
        FROM lucky_draw_entries
        WHERE config_id = $1 AND user_fingerprint = $2
      `,
      [config.id, userFingerprint]
    );
    const userEntryCount = Number(userEntryCountResult.rows[0]?.count || 0);

    if (userEntryCount >= (config.maxEntriesPerUser || 1)) {
      throw new Error('Maximum entries per user reached');
    }

    await assertTotalEntryCapacity(
      client,
      config.id,
      maxEntriesPerEvent,
      1
    );

    const entryResult = await client.query<LuckyDrawEntry>(
      `
        INSERT INTO lucky_draw_entries (
          event_id,
          config_id,
          photo_id,
          user_fingerprint,
          participant_name,
          is_winner,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${luckyDrawEntryColumns}
      `,
      [
        eventId,
        config.id,
        photoId,
        userFingerprint,
        participantName || null,
        false,
        new Date(),
      ]
    );

    await syncConfigEntryCount(client, config.id);

    return entryResult.rows[0];
  });
}

/**
 * Create one or more manual lucky draw entries
 */
export async function createManualEntries(
  tenantId: string,
  eventId: string,
  input: {
    participantName: string;
    userFingerprint?: string;
    photoId?: string | null;
    entryCount?: number;
  }
): Promise<{ entries: LuckyDrawEntry[]; userFingerprint: string }> {
  const db = getTenantDb(tenantId);
  const entitlements = await getLuckyDrawEntitlementsOrThrow(tenantId);

  const requestedCount = input.entryCount && input.entryCount > 0 ? Math.floor(input.entryCount) : 1;
  const userFingerprint = input.userFingerprint || `manual_${generateUUID()}`;

  return db.transact<{ entries: LuckyDrawEntry[]; userFingerprint: string }>(async (client) => {
    await acquireLuckyDrawEventLock(client, tenantId, eventId);

    const config = await getScheduledConfigForEvent(client, eventId, { forUpdate: true });
    if (!config) {
      throw new Error('No active draw configuration found for this event');
    }

    const existingResult = await client.query<{ count: bigint }>(
      `
        SELECT COUNT(*) as count
        FROM lucky_draw_entries
        WHERE config_id = $1 AND user_fingerprint = $2
      `,
      [config.id, userFingerprint]
    );
    const existingCount = Number(existingResult.rows[0]?.count || 0);
    const maxAllowed = config.maxEntriesPerUser || 1;

    if (existingCount + requestedCount > maxAllowed) {
      throw new Error('Maximum entries per user reached');
    }

    await assertTotalEntryCapacity(
      client,
      config.id,
      entitlements.limits.max_draw_entries_per_event,
      requestedCount
    );

    const entries: LuckyDrawEntry[] = [];
    for (let i = 0; i < requestedCount; i += 1) {
      const result = await client.query<LuckyDrawEntry>(
        `
          INSERT INTO lucky_draw_entries (
            event_id,
            config_id,
            photo_id,
            user_fingerprint,
            participant_name,
            is_winner,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING ${luckyDrawEntryColumns}
        `,
        [
          eventId,
          config.id,
          input.photoId ?? null,
          userFingerprint,
          input.participantName,
          false,
          new Date(),
        ]
      );
      entries.push(result.rows[0]);
    }

    await syncConfigEntryCount(client, config.id);

    return { entries, userFingerprint };
  });
}

/**
 * Get all entries for a config (with optional filtering)
 */
export async function getEventEntries(
  tenantId: string,
  configId: string,
  options?: {
    winnersOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<LuckyDrawEntry[]> {
  const db = getTenantDb(tenantId);

  const sql = options?.winnersOnly
    ? `SELECT ${luckyDrawEntryColumns} FROM lucky_draw_entries WHERE config_id = $1 AND is_winner = true ORDER BY created_at DESC`
    : `SELECT ${luckyDrawEntryColumns} FROM lucky_draw_entries WHERE config_id = $1 ORDER BY created_at DESC`;

  if (options?.limit) {
    const offset = options.offset || 0;
    const result = await db.query<LuckyDrawEntry>(`${sql} LIMIT $2 OFFSET $3`, [configId, options.limit, offset]);
    return result.rows;
  }

  const result = await db.query<LuckyDrawEntry>(sql, [configId]);
  return result.rows;
}

/**
 * Get entries by user fingerprint
 */
export async function getUserEntries(
  tenantId: string,
  eventId: string,
  userFingerprint: string
): Promise<LuckyDrawEntry[]> {
  const db = getTenantDb(tenantId);

  const entries = await db.query<LuckyDrawEntry>(`
    SELECT ${luckyDrawEntryColumns}
    FROM lucky_draw_entries
    WHERE event_id = $1 AND user_fingerprint = $2
    ORDER BY created_at DESC
  `, [eventId, userFingerprint]);

  return entries.rows;
}

// ============================================
// DRAW EXECUTION
// ============================================

/**
 * Execute the lucky draw and select winners
 *
 * Process:
 * 1. Get all eligible entries
 * 2. Group by user fingerprint (respect max entries per user)
 * 3. Shuffle eligible entries
 * 4. Select winners by prize tiers
 * 5. Mark winners in database
 * 6. Create winner records
 */
export async function executeDraw(
  tenantId: string,
  configId: string,
  executedBy: string,
  options?: {
    seed?: string; // For testing/reproducible draws
  }
): Promise<{
  winners: Winner[];
  statistics: {
    totalEntries: number;
    eligibleEntries: number;
    winnersSelected: number;
  };
}> {
  await getLuckyDrawEntitlementsOrThrow(tenantId);
  const db = getTenantDb(tenantId);
  void executedBy;

  return db.transact(async (client) => {
    const configSnapshot = await getConfigById(client, configId);
    if (!configSnapshot) {
      throw new Error('Draw configuration not found');
    }

    await acquireLuckyDrawEventLock(client, tenantId, configSnapshot.eventId);

    const config = await getConfigById(client, configId, { forUpdate: true });
    if (!config) {
      throw new Error('Draw configuration not found');
    }
    if (config.status !== 'scheduled') {
      throw new Error('Draw is not in scheduled status');
    }

    const totalEntriesResult = await client.query<{ count: bigint }>(
      `
        SELECT COUNT(*) as count
        FROM lucky_draw_entries
        WHERE config_id = $1
      `,
      [configId]
    );
    const totalEntries = Number(totalEntriesResult.rows[0]?.count || 0);

    const eligibleEntries = filterEligibleLuckyDrawEntries(
      await getEligibleEntryCandidates(client, configId)
    );

    if (eligibleEntries.length === 0) {
      throw new Error('No eligible entries found');
    }

    const userEntriesMap = new Map<string, LuckyDrawEntryCandidate[]>();
    for (const entry of eligibleEntries) {
      const entries = userEntriesMap.get(entry.userFingerprint) || [];
      entries.push(entry);
      userEntriesMap.set(entry.userFingerprint, entries);
    }

    const filteredEntries: LuckyDrawEntryCandidate[] = [];
    for (const entries of userEntriesMap.values()) {
      const maxCount = config.preventDuplicateWinners ? 1 : (config.maxEntriesPerUser || 1);
      filteredEntries.push(...entries.slice(0, Math.min(entries.length, maxCount)));
    }

    const eligibleEntriesCount = filteredEntries.length;

    if (eligibleEntriesCount === 0) {
      throw new Error('No eligible entries after applying duplicate rules');
    }

    const shuffledEntries = options?.seed
      ? seededShuffle(filteredEntries, options.seed)
      : fisherYatesShuffle(filteredEntries);
    const entryById = new Map(shuffledEntries.map((entry) => [entry.id, entry]));

    const winners: Winner[] = [];
    let selectionOrder = 0;

  // Sort prize tiers by tier order (grand → first → second → third → consolation)
    for (const prizeTier of sortPrizeTiers(config.prizeTiers)) {
      for (let i = 0; i < prizeTier.count; i++) {
        if (selectionOrder >= shuffledEntries.length) {
          break;
        }

        const winnerEntry = shuffledEntries[selectionOrder];
        const fallbackName = winnerEntry.userFingerprint.slice(0, 8) || 'Anonymous';
        winners.push({
          id: generateUUID(),
          eventId: winnerEntry.eventId,
          entryId: winnerEntry.id,
          userFingerprint: winnerEntry.userFingerprint,
          participantName: winnerEntry.participantName || fallbackName,
          selfieUrl: '',
          prizeTier: prizeTier.tier,
          prizeName: prizeTier.name,
          prizeDescription: prizeTier.description || '',
          selectionOrder: selectionOrder + 1,
          isClaimed: false,
          drawnAt: new Date(),
          createdAt: new Date(),
        });

        selectionOrder += 1;
      }
    }

    for (const winner of winners) {
      await client.query(
        `
          UPDATE lucky_draw_entries
          SET is_winner = true,
              prize_tier = $1
          WHERE id = $2
        `,
        [winner.prizeTier, winner.entryId]
      );
    }

    const completedAt = new Date();
    await client.query(
      `
        UPDATE lucky_draw_configs
        SET status = 'completed',
            completed_at = $2,
            updated_at = $2
        WHERE id = $1
      `,
      [configId, completedAt]
    );

    const photoIds = Array.from(
      new Set(
        winners
          .map((winner) => entryById.get(winner.entryId)?.photoId || null)
          .filter((id): id is string => Boolean(id))
      )
    );

    const photosResult = photoIds.length
      ? await client.query<{ id: string; contributorName: string | null; images: { full_url?: string } }>(
        `
          SELECT id, contributor_name AS "contributorName", images
          FROM photos
          WHERE id = ANY($1)
        `,
        [photoIds]
      )
      : {
          rows: [] as Array<{ id: string; contributorName: string | null; images: { full_url?: string } }>,
          rowCount: 0,
        };

    const photoMap = new Map(photosResult.rows.map((photo) => [photo.id, photo]));

    const enrichedWinners = winners.map((winner) => {
      const entry = entryById.get(winner.entryId);
      const photo = entry?.photoId ? photoMap.get(entry.photoId) : undefined;
      const participantName = winner.participantName || photo?.contributorName || 'Anonymous';
      const selfieUrl = photo?.images?.full_url || '';
      return {
        ...winner,
        participantName,
        selfieUrl,
      };
    });

    for (const winner of enrichedWinners) {
      await client.query(
        `
          INSERT INTO winners (
            event_id,
            entry_id,
            participant_name,
            selfie_url,
            prize_tier,
            prize_name,
            prize_description,
            selection_order,
            is_claimed,
            drawn_at,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          winner.eventId,
          winner.entryId,
          winner.participantName,
          winner.selfieUrl,
          winner.prizeTier,
          winner.prizeName,
          winner.prizeDescription,
          winner.selectionOrder,
          false,
          winner.drawnAt,
          winner.createdAt,
        ]
      );
    }

    return {
      winners: enrichedWinners,
      statistics: {
        totalEntries,
        eligibleEntries: eligibleEntriesCount,
        winnersSelected: winners.length,
      },
    };
  });
}

/**
 * Seeded shuffle for reproducible draws (for testing)
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  let seedValue = 0;

  // Simple hash function
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    }
    return hash;
  };

  seedValue = hash(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
    const j = Math.floor(Math.abs(seedValue) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ============================================
// DRAW STATUS
// ============================================

/**
 * Mark draw as completed
 */
export async function markDrawCompleted(
  tenantId: string,
  configId: string
): Promise<void> {
  const db = getTenantDb(tenantId);

  await db.update(
    'lucky_draw_configs',
    { status: 'completed', completed_at: new Date(), updated_at: new Date() },
    { id: configId }
  );
}

/**
 * Cancel a draw
 */
export async function cancelDraw(
  tenantId: string,
  configId: string,
  reason: string
): Promise<void> {
  const db = getTenantDb(tenantId);

  await db.update(
    'lucky_draw_configs',
    { status: 'cancelled', completed_at: new Date(), updated_at: new Date() },
    { id: configId }
  );
}

// ============================================
// REDRAW FUNCTIONALITY
// ============================================

/**
 * Redraw a single prize tier when a winner is unavailable.
 * Marks the previous winner as replaced and selects a new winner from remaining eligible entries.
 */
export async function redrawPrizeTier(
  tenantId: string,
  params: {
    eventId: string;
    configId: string;
    prizeTier: PrizeTier;
    previousWinnerId: string;
    reason?: string;
    redrawBy: string;
  }
): Promise<{
  newWinner: Winner;
  previousWinner: Winner | null;
}> {
  await getLuckyDrawEntitlementsOrThrow(tenantId);
  const db = getTenantDb(tenantId);
  const { eventId, configId, prizeTier, previousWinnerId, reason, redrawBy } = params;
  void redrawBy;

  return db.transact(async (client) => {
    await acquireLuckyDrawEventLock(client, tenantId, eventId);

    const config = await getConfigById(client, configId, { eventId, forUpdate: true });
    if (!config) {
      throw new Error('Draw configuration not found');
    }
    if (config.status !== 'completed') {
      throw new Error('Redraw is only allowed for completed draws');
    }

    const tierInfo = config.prizeTiers.find((tier) => tier.tier === prizeTier);
    if (!tierInfo) {
      throw new Error(`Prize tier "${prizeTier}" not found in configuration`);
    }

    const previousWinnerResult = await client.query<
      Winner & {
        configId: string;
        userFingerprint: string;
        replacementNote: string | null;
      }
    >(
      `
        SELECT
          ${winnerColumns},
          le.config_id AS "configId",
          le.user_fingerprint AS "userFingerprint",
          CASE
            WHEN w.prize_description LIKE '%[REPLACED:%' THEN w.prize_description
            ELSE NULL
          END AS "replacementNote"
        FROM winners w
        JOIN lucky_draw_entries le ON le.id = w.entry_id
        WHERE w.id = $1
        FOR UPDATE OF w, le
      `,
      [previousWinnerId]
    );
    const previousWinnerRecord = previousWinnerResult.rows[0];
    if (!previousWinnerRecord) {
      throw new Error('Previous winner not found');
    }
    if (previousWinnerRecord.eventId !== eventId || previousWinnerRecord.configId !== configId) {
      throw new Error('Previous winner does not belong to this draw');
    }
    if (previousWinnerRecord.prizeTier !== prizeTier) {
      throw new Error('Previous winner does not belong to the requested prize tier');
    }
    if (previousWinnerRecord.replacementNote) {
      throw new Error('Previous winner has already been replaced');
    }

    const previousWinner: Winner = {
      id: previousWinnerRecord.id,
      eventId: previousWinnerRecord.eventId,
      entryId: previousWinnerRecord.entryId,
      participantName: previousWinnerRecord.participantName,
      selfieUrl: previousWinnerRecord.selfieUrl,
      prizeTier: previousWinnerRecord.prizeTier,
      prizeName: previousWinnerRecord.prizeName,
      prizeDescription: previousWinnerRecord.prizeDescription,
      selectionOrder: previousWinnerRecord.selectionOrder,
      isClaimed: previousWinnerRecord.isClaimed,
      drawnAt: previousWinnerRecord.drawnAt,
      notifiedAt: previousWinnerRecord.notifiedAt,
      createdAt: previousWinnerRecord.createdAt,
    };

    await client.query(
      `
        UPDATE winners
        SET is_claimed = false,
            prize_description = COALESCE(prize_description, '') || ' [REPLACED: ' || $2 || ']',
            notified_at = NOW()
        WHERE id = $1
      `,
      [previousWinnerId, reason || 'Winner unavailable']
    );

    await client.query(
      `
        UPDATE lucky_draw_entries
        SET is_winner = false,
            prize_tier = NULL
        WHERE id = $1
      `,
      [previousWinner.entryId]
    );

    const existingWinnerFingerprints = new Set<string>();
    if (config.preventDuplicateWinners) {
      const activeWinnersResult = await client.query<{ userFingerprint: string }>(
        `
          SELECT DISTINCT le.user_fingerprint AS "userFingerprint"
          FROM winners w
          JOIN lucky_draw_entries le ON le.id = w.entry_id
          WHERE w.event_id = $1
            AND w.prize_description NOT LIKE '%[REPLACED:%'
        `,
        [eventId]
      );

      for (const row of activeWinnersResult.rows) {
        existingWinnerFingerprints.add(row.userFingerprint);
      }
    }

    existingWinnerFingerprints.add(previousWinnerRecord.userFingerprint);

    const eligibleEntries = filterEligibleRedrawEntries(
      await getEligibleEntryCandidates(client, configId),
      existingWinnerFingerprints,
      new Set([previousWinner.entryId])
    );

    if (eligibleEntries.length === 0) {
      throw new Error('No eligible entries available for redraw');
    }

    const shuffled = fisherYatesShuffle(eligibleEntries);
    const selectedEntry = shuffled[0];

    let selfieUrl = '';
    let participantName = selectedEntry.participantName || 'Anonymous';

    if (selectedEntry.photoId) {
      const photoResult = await client.query<{ contributorName: string | null; images: { full_url?: string } }>(
        `
          SELECT contributor_name AS "contributorName", images
          FROM photos
          WHERE id = $1
        `,
        [selectedEntry.photoId]
      );

      if (photoResult.rows[0]) {
        selfieUrl = photoResult.rows[0].images?.full_url || '';
        participantName = photoResult.rows[0].contributorName || participantName;
      }
    }

    await client.query(
      `
        UPDATE lucky_draw_entries
        SET is_winner = true,
            prize_tier = $1
        WHERE id = $2
      `,
      [prizeTier, selectedEntry.id]
    );

    const maxOrderResult = await client.query<{ maxOrder: number }>(
      `
        SELECT COALESCE(MAX(selection_order), 0) as "maxOrder"
        FROM winners
        WHERE event_id = $1
      `,
      [eventId]
    );
    const nextOrder = (maxOrderResult.rows[0]?.maxOrder || 0) + 1;

    const newWinner: Winner = {
      id: generateUUID(),
      eventId,
      entryId: selectedEntry.id,
      participantName,
      selfieUrl,
      prizeTier: tierInfo.tier,
      prizeName: tierInfo.name,
      prizeDescription: buildRedrawPrizeDescription(tierInfo.description, reason),
      selectionOrder: nextOrder,
      isClaimed: false,
      drawnAt: new Date(),
      createdAt: new Date(),
    };

    await client.query(
      `
        INSERT INTO winners (
          event_id,
          entry_id,
          participant_name,
          selfie_url,
          prize_tier,
          prize_name,
          prize_description,
          selection_order,
          is_claimed,
          drawn_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        newWinner.eventId,
        newWinner.entryId,
        newWinner.participantName,
        newWinner.selfieUrl,
        newWinner.prizeTier,
        newWinner.prizeName,
        newWinner.prizeDescription,
        newWinner.selectionOrder,
        false,
        newWinner.drawnAt,
        newWinner.createdAt,
      ]
    );

    await client.query(
      `
        UPDATE lucky_draw_configs
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [configId]
    );

    return {
      newWinner,
      previousWinner,
    };
  });
}

// ============================================
// WINNER MANAGEMENT
// ============================================

/**
 * Get winners for a specific draw
 */
export async function getDrawWinners(
  tenantId: string,
  eventId: string
): Promise<Winner[]> {
  const db = getTenantDb(tenantId);

  const winners = await db.query<Winner>(`
    SELECT ${winnerColumns}
    FROM winners
    WHERE event_id = $1
    ORDER BY drawn_at DESC
  `, [eventId]);

  return winners.rows;
}

/**
 * Mark winner as claimed
 */
export async function markWinnerClaimed(
  tenantId: string,
  winnerId: string
): Promise<void> {
  const db = getTenantDb(tenantId);

  await db.update(
    'winners',
    { is_claimed: true, notified_at: new Date() },
    { id: winnerId }
  );
}

/**
 * Get all winners for a tenant (paginated)
 */
export async function getTenantWinners(
  tenantId: string,
  options?: {
    limit?: number;
    offset?: number;
    claimed?: boolean;
  }
): Promise<Winner[]> {
  const db = getTenantDb(tenantId);

  let sql = `SELECT ${winnerColumns} FROM winners`;
  const params: unknown[] = [];
  let paramIndex = 1;

  const conditions: string[] = [];
  if (options?.claimed !== undefined) {
    conditions.push(`is_claimed = $${paramIndex++}`);
    params.push(options.claimed);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY drawn_at DESC';

  if (options?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(options.limit);
    if (options.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }
  }

  const result = await db.query<Winner>(sql, params);
  return result.rows;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get draw statistics for an event
 */
export async function getDrawStatistics(
  tenantId: string,
  eventId: string
): Promise<{
  totalEntries: number;
  uniqueParticipants: number;
  totalDraws: number;
  totalWinners: number;
}> {
  const db = getTenantDb(tenantId);

  // Count total entries
  const entryCountResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM lucky_draw_entries WHERE event_id = $1`, [eventId]
  );
  const entryCount = Number(entryCountResult.rows[0]?.count || 0);

  // Count unique participants (by fingerprint)
  const participantCountResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(DISTINCT user_fingerprint) as count FROM lucky_draw_entries WHERE event_id = $1`, [eventId]
  );
  const participantCount = Number(participantCountResult.rows[0]?.count || 0);

  // Count total draws
  const drawCountResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM lucky_draw_configs WHERE event_id = $1 AND status = 'completed'`, [eventId]
  );
  const drawCount = Number(drawCountResult.rows[0]?.count || 0);

  // Count total winners
  const winnerCountResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM winners WHERE event_id = $1`, [eventId]
  );
  const winnerCount = Number(winnerCountResult.rows[0]?.count || 0);

  return {
    totalEntries: entryCount,
    uniqueParticipants: participantCount,
    totalDraws: drawCount,
    totalWinners: winnerCount,
  };
}

/**
 * Preview draw eligibility before execution.
 *
 * Returns a breakdown of total entries, eligible entries (after photo-status
 * and duplicate-winner filtering), prize slots requested, and any warnings
 * the organizer should see before triggering the draw.
 */
export async function previewDrawEligibility(
  tenantId: string,
  eventId: string
): Promise<{
  configId: string | null;
  status: DrawStatus | null;
  totalEntries: number;
  eligibleEntries: number;
  uniqueEligibleParticipants: number;
  totalPrizeSlots: number;
  prizeTierBreakdown: { tier: string; name: string; count: number }[];
  warnings: string[];
}> {
  const db = getTenantDb(tenantId);
  const config = await getLatestConfig(tenantId, eventId);

  if (!config || config.status !== 'scheduled') {
    return {
      configId: config?.id || null,
      status: config?.status || null,
      totalEntries: 0,
      eligibleEntries: 0,
      uniqueEligibleParticipants: 0,
      totalPrizeSlots: 0,
      prizeTierBreakdown: [],
      warnings: config
        ? [`Draw status is '${config.status}', not 'scheduled'`]
        : ['No draw configuration found for this event'],
    };
  }

  const totalResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM lucky_draw_entries WHERE config_id = $1`,
    [config.id]
  );
  const totalEntries = Number(totalResult.rows[0]?.count || 0);

  const candidateResult = await db.query<LuckyDrawEntryCandidate>(
    `
      SELECT
        ${luckyDrawEntryColumns},
        p.status AS "photoStatus"
      FROM lucky_draw_entries le
      LEFT JOIN photos p ON p.id = le.photo_id
      WHERE le.config_id = $1
        AND le.is_winner = false
      ORDER BY le.created_at ASC
    `,
    [config.id]
  );

  const eligible = filterEligibleLuckyDrawEntries(candidateResult.rows);

  // Apply same duplicate-winner grouping as executeDraw
  const userEntriesMap = new Map<string, LuckyDrawEntryCandidate[]>();
  for (const entry of eligible) {
    const entries = userEntriesMap.get(entry.userFingerprint) || [];
    entries.push(entry);
    userEntriesMap.set(entry.userFingerprint, entries);
  }

  const filteredEntries: LuckyDrawEntryCandidate[] = [];
  for (const entries of userEntriesMap.values()) {
    const maxCount = config.preventDuplicateWinners ? 1 : (config.maxEntriesPerUser || 1);
    filteredEntries.push(...entries.slice(0, Math.min(entries.length, maxCount)));
  }

  const uniqueEligibleParticipants = userEntriesMap.size;

  const sortedTiers = sortPrizeTiers(config.prizeTiers);
  const totalPrizeSlots = sortedTiers.reduce((sum, t) => sum + t.count, 0);
  const prizeTierBreakdown = sortedTiers.map((t) => ({
    tier: t.tier,
    name: t.name,
    count: t.count,
  }));

  const warnings: string[] = [];

  if (totalEntries === 0) {
    warnings.push('No entries yet — draw cannot execute');
  } else if (filteredEntries.length === 0) {
    warnings.push('No eligible entries after filtering (photo approval + duplicate rules)');
  }

  if (filteredEntries.length > 0 && filteredEntries.length < totalPrizeSlots) {
    const unfilled = totalPrizeSlots - filteredEntries.length;
    warnings.push(
      `Only ${filteredEntries.length} eligible entries for ${totalPrizeSlots} prize slots — ${unfilled} prize(s) will go unawarded`
    );
  }

  const pendingCount = candidateResult.rows.filter(
    (e) => e.photoId && e.photoStatus === 'pending'
  ).length;
  if (pendingCount > 0) {
    warnings.push(
      `${pendingCount} entries have photos pending moderation — they won't be eligible until approved`
    );
  }

  return {
    configId: config.id,
    status: config.status,
    totalEntries,
    eligibleEntries: filteredEntries.length,
    uniqueEligibleParticipants,
    totalPrizeSlots,
    prizeTierBreakdown,
    warnings,
  };
}

/**
 * Get entry statistics by user fingerprint
 */
export async function getUserEntryStatistics(
  tenantId: string,
  eventId: string,
  userFingerprint: string
): Promise<{
  entryCount: number;
  hasWon: boolean;
}> {
  const db = getTenantDb(tenantId);

  // Count entries
  const entryCountResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM lucky_draw_entries WHERE event_id = $1 AND user_fingerprint = $2`,
    [eventId, userFingerprint]
  );
  const entryCount = Number(entryCountResult.rows[0]?.count || 0);

  // Check if user has won
  const winnerResult = await db.query<{ count: bigint }>(
    `SELECT COUNT(*) as count FROM lucky_draw_entries WHERE event_id = $1 AND user_fingerprint = $2 AND is_winner = true`,
    [eventId, userFingerprint]
  );
  const hasWon = Number(winnerResult.rows[0]?.count || 0) > 0;

  return {
    entryCount,
    hasWon,
  };
}
