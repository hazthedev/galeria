// ============================================
// Galeria - Reserved Short Codes
// ============================================

export const RESERVED_SHORT_CODES = [
  'admin',
  'auth',
  'api',
  'events',
  'organizer',
  'profile',
  'e',
  'attendance',
  'terms',
  'privacy',
] as const;

export function isReservedShortCode(shortCode: string): boolean {
  return RESERVED_SHORT_CODES.includes(
    shortCode.trim().toLowerCase() as (typeof RESERVED_SHORT_CODES)[number]
  );
}
