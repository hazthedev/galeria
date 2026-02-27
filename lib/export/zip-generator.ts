// ============================================
// Galeria - Photo Export ZIP Generator
// ============================================

import archiver from 'archiver';
import type { IEvent, IPhoto } from '@/lib/types';

export interface CreatePhotoExportZipOptions {
  event: IEvent;
  photos: IPhoto[];
  watermark?: boolean;
  includeManifest?: boolean;
}

export interface CreatePhotoExportZipResult {
  stream: archiver.Archiver;
  filename: string;
}

export async function createPhotoExportZip(
  options: CreatePhotoExportZipOptions
): Promise<CreatePhotoExportZipResult> {
  const { event, photos, watermark = false, includeManifest = false } = options;

  // Sanitize event name for filename
  const safeEventName = event.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeEventName}_photos.zip`;

  const archive = archiver('zip', { zlib: { level: 9 } });

  // Add photos to ZIP
  for (const photo of photos) {
    const imageUrl = photo.images.full_url || photo.images.original_url;
    const photoName = photo.caption
      ? `${photo.caption.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id.slice(0, 8)}.jpg`
      : `${photo.id.slice(0, 8)}.jpg`;

    // Fetch image and add to archive
    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: photoName });
      }
    } catch (error) {
      console.error(`[ZIP_GENERATOR] Failed to fetch photo ${photo.id}:`, error);
    }
  }

  // Add manifest if requested
  if (includeManifest) {
    const manifest = {
      event: {
        id: event.id,
        name: event.name,
        date: event.event_date,
      },
      photos: photos.map((p) => ({
        id: p.id,
        caption: p.caption,
        contributor: p.is_anonymous ? 'Anonymous' : p.contributor_name,
        uploaded_at: p.created_at,
      })),
      exported_at: new Date().toISOString(),
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  }

  await archive.finalize();

  return { stream: archive, filename };
}
