/**
 * Content Quarantine System
 *
 * Stores flagged/inappropriate content separately from public storage.
 * Prevents public access until content is reviewed and approved.
 * Auto-deletes unreviewed content after 7 days.
 */

import 'server-only';

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type QuarantineStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface QuarantineMetadata {
  photoId: string;
  eventId: string;
  originalPath: string;
  status: QuarantineStatus;
  flaggedAt: Date;
  expiresAt: Date;
  reason?: string;
  categories?: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface QuarantineItem {
  metadata: QuarantineMetadata;
  storagePath: string;
  hasPreview: boolean;
}

interface StoredQuarantineMetadata {
  photoId: string;
  eventId: string;
  originalPath: string;
  status: QuarantineStatus;
  flaggedAt: string | Date;
  expiresAt: string | Date;
  reason?: string;
  categories?: string[];
  reviewedBy?: string;
  reviewedAt?: string | Date;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'galeria-dev';

const QUARANTINE_PREFIX = 'quarantine';
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
}

export async function quarantinePhoto(
  eventId: string,
  photoId: string,
  reason?: string,
  categories?: string[]
): Promise<QuarantineMetadata> {
  const client = getR2Client();
  const originalPath = `${eventId}/${photoId}`;
  const quarantinePath = `${QUARANTINE_PREFIX}/${photoId}`;

  const metadata: QuarantineMetadata = {
    photoId,
    eventId,
    originalPath,
    status: 'pending',
    flaggedAt: new Date(),
    expiresAt: new Date(Date.now() + EXPIRY_MS),
    reason,
    categories,
  };

  try {
    const assets = await listPhotoAssets(originalPath);

    for (const asset of assets) {
      const sourceKey = `${originalPath}/${asset.name}`;
      const destKey = `${quarantinePath}/${asset.name}`;

      await client.send(new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${sourceKey}`,
        Key: destKey,
        MetadataDirective: 'REPLACE',
        Metadata: {
          'quarantine-status': 'pending',
          'quarantine-reason': reason || '',
          'quarantine-categories': categories?.join(',') || '',
          'original-path': originalPath,
        },
      }));
    }

    await storeQuarantineMetadata(photoId, metadata);
    await deletePhotoAssets(originalPath);

    return metadata;
  } catch (error) {
    console.error(`[Quarantine] Error quarantining photo ${photoId}:`, error);
    throw error;
  }
}

export async function approveQuarantinedPhoto(
  photoId: string,
  reviewedBy: string
): Promise<void> {
  const client = getR2Client();
  const metadata = await getQuarantineMetadata(photoId);

  if (!metadata) {
    throw new Error(`Quarantined photo ${photoId} not found`);
  }

  const quarantinePath = `${QUARANTINE_PREFIX}/${photoId}`;
  const originalPath = metadata.originalPath;

  try {
    const assets = await listPhotoAssets(quarantinePath);

    for (const asset of assets) {
      const sourceKey = `${quarantinePath}/${asset.name}`;
      const destKey = `${originalPath}/${asset.name}`;

      await client.send(new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${sourceKey}`,
        Key: destKey,
      }));
    }

    metadata.status = 'approved';
    metadata.reviewedBy = reviewedBy;
    metadata.reviewedAt = new Date();
    await storeQuarantineMetadata(photoId, metadata);

    await deletePhotoAssets(quarantinePath);
  } catch (error) {
    console.error(`[Quarantine] Error approving photo ${photoId}:`, error);
    throw error;
  }
}

export async function rejectQuarantinedPhoto(
  photoId: string,
  reviewedBy: string
): Promise<void> {
  const metadata = await getQuarantineMetadata(photoId);

  if (!metadata) {
    throw new Error(`Quarantined photo ${photoId} not found`);
  }

  const quarantinePath = `${QUARANTINE_PREFIX}/${photoId}`;

  try {
    await deletePhotoAssets(quarantinePath);

    metadata.status = 'rejected';
    metadata.reviewedBy = reviewedBy;
    metadata.reviewedAt = new Date();
    await storeQuarantineMetadata(photoId, metadata);
  } catch (error) {
    console.error(`[Quarantine] Error rejecting photo ${photoId}:`, error);
    throw error;
  }
}

export async function getQuarantinePreviewUrl(
  photoId: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getR2Client();

  try {
    const quarantinePath = `${QUARANTINE_PREFIX}/${photoId}`;
    const assets = await listPhotoAssets(quarantinePath);

    if (assets.length === 0) {
      return null;
    }

    const thumbnail = assets.find((asset) => asset.name.includes('thumbnail')) || assets[0];
    const key = `${quarantinePath}/${thumbnail.name}`;

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error(`[Quarantine] Error generating preview for ${photoId}:`, error);
    return null;
  }
}

export async function getQuarantinedPhotosByEvent(eventId: string): Promise<QuarantineItem[]> {
  const client = getR2Client();

  try {
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${QUARANTINE_PREFIX}-metadata/`,
    }));

    const items: QuarantineItem[] = [];

    if (listed.Contents) {
      for (const object of listed.Contents) {
        const photoId = object.Key?.split('/').pop()?.replace('.json', '');
        if (!photoId) {
          continue;
        }

        const metadata = await getQuarantineMetadata(photoId);
        if (metadata && metadata.eventId === eventId) {
          items.push({
            metadata,
            storagePath: `${QUARANTINE_PREFIX}/${photoId}`,
            hasPreview: true,
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error(`[Quarantine] Error listing quarantined photos for event ${eventId}:`, error);
    return [];
  }
}

export async function cleanupExpiredQuarantine(): Promise<number> {
  const client = getR2Client();
  const now = new Date();
  let cleanedCount = 0;

  try {
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${QUARANTINE_PREFIX}-metadata/`,
    }));

    if (!listed.Contents) {
      return 0;
    }

    for (const object of listed.Contents) {
      const photoId = object.Key?.split('/').pop()?.replace('.json', '');
      if (!photoId) {
        continue;
      }

      const metadata = await getQuarantineMetadata(photoId);
      if (!metadata) {
        continue;
      }

      if (metadata.status === 'pending' && metadata.expiresAt < now) {
        await rejectQuarantinedPhoto(photoId, 'system-cleanup');
        metadata.status = 'expired';
        await storeQuarantineMetadata(photoId, metadata);
        cleanedCount += 1;
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error('[Quarantine] Error during cleanup:', error);
    return cleanedCount;
  }
}

async function listPhotoAssets(prefix: string): Promise<Array<{ name: string; size: number }>> {
  const client = getR2Client();

  try {
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${prefix}/`,
    }));

    return (listed.Contents || []).map((object) => ({
      name: object.Key?.split('/').pop() || '',
      size: object.Size || 0,
    }));
  } catch {
    return [];
  }
}

async function deletePhotoAssets(prefix: string): Promise<void> {
  const client = getR2Client();
  const assets = await listPhotoAssets(prefix);

  if (assets.length === 0) {
    return;
  }

  await client.send(new DeleteObjectsCommand({
    Bucket: R2_BUCKET_NAME,
    Delete: {
      Objects: assets.map((asset) => ({ Key: `${prefix}/${asset.name}` })),
    },
  }));
}

async function deleteMetadataObject(photoId: string): Promise<void> {
  const client = getR2Client();

  await client.send(new DeleteObjectsCommand({
    Bucket: R2_BUCKET_NAME,
    Delete: {
      Objects: [{ Key: `${QUARANTINE_PREFIX}-metadata/${photoId}.json` }],
    },
  }));
}

async function storeQuarantineMetadata(
  photoId: string,
  metadata: QuarantineMetadata
): Promise<void> {
  const client = getR2Client();

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: `${QUARANTINE_PREFIX}-metadata/${photoId}.json`,
    Body: JSON.stringify(metadata),
    ContentType: 'application/json',
  }));
}

export function deserializeQuarantineMetadata(
  metadata: StoredQuarantineMetadata
): QuarantineMetadata {
  return {
    ...metadata,
    flaggedAt:
      metadata.flaggedAt instanceof Date
        ? metadata.flaggedAt
        : new Date(metadata.flaggedAt),
    expiresAt:
      metadata.expiresAt instanceof Date
        ? metadata.expiresAt
        : new Date(metadata.expiresAt),
    reviewedAt: metadata.reviewedAt
      ? metadata.reviewedAt instanceof Date
        ? metadata.reviewedAt
        : new Date(metadata.reviewedAt)
      : undefined,
  };
}

export async function getQuarantineMetadata(photoId: string): Promise<QuarantineMetadata | null> {
  const client = getR2Client();

  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `${QUARANTINE_PREFIX}-metadata/${photoId}.json`,
    }));

    const body = await response.Body?.transformToString();
    if (!body) {
      return null;
    }

    return deserializeQuarantineMetadata(JSON.parse(body) as StoredQuarantineMetadata);
  } catch {
    return null;
  }
}

export async function hasQuarantineRecord(photoId: string): Promise<boolean> {
  return Boolean(await getQuarantineMetadata(photoId));
}

export async function updateQuarantineStatus(
  photoId: string,
  updates: {
    status: QuarantineStatus;
    reviewedBy?: string;
    reviewedAt?: Date;
    reason?: string;
    categories?: string[];
  }
): Promise<QuarantineMetadata | null> {
  const metadata = await getQuarantineMetadata(photoId);
  if (!metadata) {
    return null;
  }

  metadata.status = updates.status;
  if (updates.reviewedBy !== undefined) {
    metadata.reviewedBy = updates.reviewedBy;
  }
  if (updates.reviewedAt !== undefined) {
    metadata.reviewedAt = updates.reviewedAt;
  }
  if (updates.reason !== undefined) {
    metadata.reason = updates.reason;
  }
  if (updates.categories !== undefined) {
    metadata.categories = updates.categories;
  }

  await storeQuarantineMetadata(photoId, metadata);
  return metadata;
}

export async function purgeQuarantinedPhoto(photoId: string): Promise<void> {
  const quarantinePath = `${QUARANTINE_PREFIX}/${photoId}`;

  await deletePhotoAssets(quarantinePath);
  await deleteMetadataObject(photoId);
}

export interface QuarantineStats {
  totalQuarantined: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  expiringIn24h: number;
}

export async function getQuarantineStats(): Promise<QuarantineStats> {
  const client = getR2Client();
  const stats: QuarantineStats = {
    totalQuarantined: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    expiringIn24h: 0,
  };

  try {
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${QUARANTINE_PREFIX}-metadata/`,
    }));

    if (listed.Contents) {
      const dayFromNow = Date.now() + (24 * 60 * 60 * 1000);

      for (const object of listed.Contents) {
        const photoId = object.Key?.split('/').pop()?.replace('.json', '');
        if (!photoId) {
          continue;
        }

        const metadata = await getQuarantineMetadata(photoId);
        if (!metadata) {
          continue;
        }

        stats.totalQuarantined += 1;

        switch (metadata.status) {
          case 'pending':
            stats.pending += 1;
            if (metadata.expiresAt.getTime() < dayFromNow) {
              stats.expiringIn24h += 1;
            }
            break;
          case 'approved':
            stats.approved += 1;
            break;
          case 'rejected':
            stats.rejected += 1;
            break;
          case 'expired':
            stats.expired += 1;
            break;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error('[Quarantine] Error getting stats:', error);
    return stats;
  }
}
