import type { IPhoto } from '@/lib/types';

const GUEST_REJECTED_PLACEHOLDER_URL = '/icons/galeria-icon-frame.svg';

export function redactRejectedPhotosForGuest<T extends IPhoto>(photos: T[]): T[] {
  return photos.map((photo) => {
    if (photo.status !== 'rejected') {
      return photo;
    }

    return {
      ...photo,
      images: {
        ...photo.images,
        original_url: GUEST_REJECTED_PLACEHOLDER_URL,
        thumbnail_url: GUEST_REJECTED_PLACEHOLDER_URL,
        medium_url: GUEST_REJECTED_PLACEHOLDER_URL,
        full_url: GUEST_REJECTED_PLACEHOLDER_URL,
      },
    };
  });
}
