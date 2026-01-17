// ============================================
// MOMENTIQUE - Client Fingerprint Helper
// ============================================

const STORAGE_KEY = 'momentique_fingerprint';

export function getClientFingerprint(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const fallback = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : fallback;

  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
