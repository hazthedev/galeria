'use client';

import Lightbox from 'yet-another-react-lightbox';
import type { IPhoto } from '@/lib/types';

interface PhotoGalleryLightboxProps {
  canOpenLightbox: boolean;
  close: () => void;
  index: number;
  open: boolean;
  photos: IPhoto[];
}

export function PhotoGalleryLightbox({
  canOpenLightbox,
  close,
  index,
  open,
  photos,
}: PhotoGalleryLightboxProps) {
  if (photos.length === 0 || !canOpenLightbox) {
    return null;
  }

  return (
    <Lightbox
      open={open}
      close={close}
      index={index}
      slides={photos.map((photo) => ({
        src: photo.images.full_url,
        alt: photo.caption || 'Event photo',
        caption: photo.caption,
      }))}
    />
  );
}
