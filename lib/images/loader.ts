import type { ImageLoaderProps } from 'next/image';

const BASE_PATH = '/_next/image';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const normalizedSrc = src.startsWith('http')
    ? src
    : R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${src.replace(/^\//, '')}`
      : src;

  const params = new URLSearchParams({
    url: normalizedSrc,
    w: String(width),
    q: String(quality || 75),
  });

  return `${BASE_PATH}?${params.toString()}`;
}
