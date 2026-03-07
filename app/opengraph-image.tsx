import { ImageResponse } from 'next/og';
import { createBrandPreview } from '@/lib/brand/brand-image';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(createBrandPreview(size.width, size.height), size);
}
