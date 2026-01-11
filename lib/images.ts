// ============================================
// MOMENTIQUE - Image Processing & Storage
// ============================================

import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import type { IPhotoImage } from './types';

// ============================================
// CONFIGURATION
// ============================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'momentique-dev';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-xxxxxxxxx.r2.dev';

// Image processing constants
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 85;

// ============================================
// R2/S3 CLIENT
// ============================================

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

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Compress and upload image to R2/S3 storage
 * Uses single size for MVP (no thumbnails)
 */
export async function uploadImageToStorage(
  eventId: string,
  photoId: string,
  imageBuffer: Buffer,
  originalFilename: string
): Promise<IPhotoImage> {
  const client = getR2Client();
  const path = `${eventId}/${photoId}`;

  // Compress image using Sharp (single size for MVP)
  let compressedBuffer: Buffer;
  let width: number;
  let height: number;

  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Calculate dimensions (fit within max dimension)
    const imageWidth = metadata.width || MAX_DIMENSION;
    const imageHeight = metadata.height || MAX_DIMENSION;
    const scale = Math.min(MAX_DIMENSION / imageWidth, MAX_DIMENSION / imageHeight, 1);

    width = Math.round(imageWidth * scale);
    height = Math.round(imageHeight * scale);

    // Compress to JPEG at specified quality
    compressedBuffer = await image
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch (error) {
    console.error('[Storage] Image compression failed:', error);
    // Fallback to original buffer
    compressedBuffer = imageBuffer;
    width = MAX_DIMENSION;
    height = MAX_DIMENSION;
  }

  // Upload compressed image to R2
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: `${path}/photo.jpg`,
    Body: compressedBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  // Return same URL for all sizes (MVP simplification - no thumbnails)
  const url = `${R2_PUBLIC_URL}/${path}/photo.jpg`;

  return {
    original_url: url,
    thumbnail_url: url,
    medium_url: url,
    full_url: url,
    width,
    height,
    file_size: compressedBuffer.length,
    format: 'jpg',
  };
}

/**
 * Delete all photos for an event from storage
 */
export async function deleteEventPhotos(eventId: string): Promise<void> {
  const client = getR2Client();

  try {
    // List all objects with the event prefix
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${eventId}/`,
    }));

    // Delete all objects
    if (listed.Contents && listed.Contents.length > 0) {
      const objects = listed.Contents.map((obj) => ({ Key: obj.Key || '' }));

      await client.send(new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: objects,
        },
      }));
    }

    console.log(`[Storage] Deleted ${listed.Contents?.length || 0} photos for event ${eventId}`);
  } catch (error) {
    console.error(`[Storage] Error deleting photos for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Generate signed URL for private access
 */
export function generateSignedUrl(key: string, _expiresIn: number = 3600): string {
  // TODO: Implement signed URL generation
  // For now, return public URL
  return `${R2_PUBLIC_URL}/${key}`;
}

// ============================================
// IMAGE PROCESSING
// ============================================

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensionsFromBuffer(
  _buffer: Buffer
): Promise<{ width: number; height: number }> {
  return new Promise((_resolve) => {
    // TODO: Implement using sharp package
    // For now, return default dimensions
    _resolve({ width: 1920, height: 1080 });
  });
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  _size: 300
): Promise<Buffer> {
  // TODO: Implement using sharp package
  return imageBuffer;
}

/**
 * Generate medium-sized image
 */
export async function generateMediumImage(
  imageBuffer: Buffer,
  _maxSize: 800
): Promise<Buffer> {
  // TODO: Implement using sharp package
  return imageBuffer;
}

// ============================================
// IMAGE VALIDATION
// ============================================

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, HEIC, WebP' };
  }

  return { valid: true };
}

// ============================================
// CONTENT MODERATION (AI)
// ============================================

/**
 * Check image for NSFW content
 */
export async function checkNSFW(_imageBuffer: Buffer): Promise<{
  isNSFW: boolean;
  confidence: number;
  labels: Array<{ name: string; confidence: number }>;
}> {
  // TODO: Implement using AWS Rekognition or similar
  // For now, return safe result
  return {
    isNSFW: false,
    confidence: 0,
    labels: [],
  };
}

/**
 * Check image for suspicious content
 */
export async function checkSuspiciousContent(_imageBuffer: Buffer): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  // TODO: Implement AI-based content analysis
  // Check for: weapons, alcohol, drugs, text in image, etc.
  return {
    isSuspicious: false,
    reasons: [],
  };
}

// ============================================
// EXPORT HELPERS
// ============================================

/**
 * Generate ZIP file for photo export
 */
export async function generateEventZip(_eventId: string): Promise<Buffer> {
  // TODO: Implement using archiver package
  // Fetch all photos from storage
  // Add to ZIP with metadata CSV
  return Buffer.from('');
}

/**
 * Get storage usage for event
 */
export async function getEventStorageUsage(_eventId: string): Promise<{
  totalSize: number;
  photoCount: number;
}> {
  // TODO: Calculate actual storage usage
  return {
    totalSize: 0,
    photoCount: 0,
  };
}
