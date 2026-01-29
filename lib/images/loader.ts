import type { ImageLoaderProps } from 'next/image';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';

export default function imageLoader({ src }: ImageLoaderProps) {
  const normalizedSrc = src.startsWith('http')
    ? src
    : R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${src.replace(/^\//, '')}`
      : src;

  // Return the direct URL so Next doesn't call /_next/image (custom loaders bypass the optimizer).
  return normalizedSrc;
}
