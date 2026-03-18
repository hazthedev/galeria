import 'server-only';

import type { IPhoto, IPhotoImage } from '@/lib/types';
import { getQuarantinePreviewUrl } from '@/lib/storage/quarantine';

type PreviewableStatus = string | null | undefined;

export interface PreviewableImageRecord {
  photoId: string | null;
  photoStatus: string | null;
  imageUrl: string | null;
}

export function shouldUseQuarantinePreview(status: PreviewableStatus): boolean {
  return status === 'pending' || status === 'rejected';
}

export function applyModeratorPreviewToImages(
  images: IPhotoImage,
  previewUrl: string
): IPhotoImage {
  return {
    ...images,
    original_url: previewUrl,
    thumbnail_url: previewUrl,
    medium_url: previewUrl,
    full_url: previewUrl,
  };
}

async function getCachedPreviewUrl(
  cache: Map<string, Promise<string | null>>,
  photoId: string
): Promise<string | null> {
  let previewPromise = cache.get(photoId);

  if (!previewPromise) {
    previewPromise = getQuarantinePreviewUrl(photoId);
    cache.set(photoId, previewPromise);
  }

  return previewPromise;
}

export async function hydrateModeratorPhotoPreviews<T extends Pick<IPhoto, 'id' | 'status' | 'images'>>(
  photos: T[]
): Promise<T[]> {
  const previewCache = new Map<string, Promise<string | null>>();

  return Promise.all(
    photos.map(async (photo) => {
      if (!shouldUseQuarantinePreview(photo.status)) {
        return photo;
      }

      const previewUrl = await getCachedPreviewUrl(previewCache, photo.id);
      if (!previewUrl) {
        return photo;
      }

      return {
        ...photo,
        images: applyModeratorPreviewToImages(photo.images, previewUrl),
      };
    })
  );
}

export async function hydrateModeratorImagePreviewUrls<T extends PreviewableImageRecord>(
  records: T[]
): Promise<T[]> {
  const previewCache = new Map<string, Promise<string | null>>();

  return Promise.all(
    records.map(async (record) => {
      if (!record.photoId || !shouldUseQuarantinePreview(record.photoStatus)) {
        return record;
      }

      const previewUrl = await getCachedPreviewUrl(previewCache, record.photoId);
      if (!previewUrl) {
        return record;
      }

      return {
        ...record,
        imageUrl: previewUrl,
      };
    })
  );
}
