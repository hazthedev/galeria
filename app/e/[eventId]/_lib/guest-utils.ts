import type { IPhoto } from '@/lib/types';

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}

export async function resizeImageIfNeeded(
  file: File,
  maxDimension: number
): Promise<{ file: File; resized: boolean }> {
  try {
    const img = await loadImageElement(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return { file, resized: false };

    const scale = Math.min(maxDimension / width, maxDimension / height, 1);
    if (scale >= 1) return { file, resized: false };

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, resized: false };

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const outputType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, 0.9)
    );
    if (!blob) return { file, resized: false };

    return {
      file: new File([blob], file.name, { type: blob.type || outputType, lastModified: file.lastModified }),
      resized: true,
    };
  } catch {
    return { file, resized: false };
  }
}

export function mergePhotos(approved: IPhoto[], pending: IPhoto[], rejected: IPhoto[]): IPhoto[] {
  const merged = new Map<string, IPhoto>();
  const add = (photo: IPhoto) => {
    const existing = merged.get(photo.id);
    if (!existing) {
      merged.set(photo.id, photo);
    }
  };
  approved.forEach(add);
  pending.forEach(add);
  rejected.forEach(add);
  return Array.from(merged.values());
}

export function formatDrawNumber(entryId?: string | null) {
  if (!entryId) return '----';
  const clean = entryId.replace(/-/g, '');
  if (!clean) return '----';
  return clean.slice(-4).toUpperCase().padStart(4, '0');
}

export function formatEntryNumbers(entryIds: Array<string | null | undefined>) {
  const formatted = entryIds
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((id) => formatDrawNumber(id))
    .filter((value) => value !== '----');
  return formatted;
}

export function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

export function isColorDark(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance < 0.5;
}

export function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
