export const PHOTO_CARD_STYLES = [
  { id: 'vacation', label: 'Vacation', description: 'Bright, airy, postcard vibe' },
  { id: 'brutalist', label: 'Brutalist', description: 'Bold borders, raw contrast' },
  { id: 'wedding', label: 'Wedding', description: 'Soft, romantic, refined' },
  { id: 'celebration', label: 'Celebration', description: 'Warm, festive, joyful' },
  { id: 'futuristic', label: 'Futuristic', description: 'Neon glow, sleek tech' },
];

export const THEME_PRESETS = [
  {
    id: 'palette-1',
    label: 'Vibrant Travel',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: 'linear-gradient(135deg, #FFE5E5 0%, #FFF5E1 50%, #E0F7F4 100%)',
  },
  {
    id: 'palette-2',
    label: 'Tropical Paradise',
    primary: '#06B6D4',
    secondary: '#10B981',
    background: 'linear-gradient(135deg, #E0F7FA 0%, #E8F5E9 50%, #FFF3E0 100%)',
  },
  {
    id: 'palette-3',
    label: 'Refined Purple',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    background: 'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 50%, #FFF8E1 100%)',
  },
  {
    id: 'palette-4',
    label: 'Sunset Glow',
    primary: '#F97316',
    secondary: '#DC2626',
    background: 'linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 50%, #FFF9C4 100%)',
  },
  {
    id: 'palette-5',
    label: 'Ocean Breeze',
    primary: '#0EA5E9',
    secondary: '#6366F1',
    background: 'linear-gradient(135deg, #E3F2FD 0%, #EDE7F6 50%, #E0F2F1 100%)',
  },
];

export const PHOTO_CARD_STYLE_CLASSES: Record<string, string> = {
  vacation: 'rounded-2xl bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5',
  brutalist: 'rounded-none bg-white border-2 border-black shadow-[6px_6px_0_#000]',
  wedding: 'rounded-3xl bg-white border border-rose-200 shadow-[0_8px_24px_rgba(244,114,182,0.25)]',
  celebration: 'rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-pink-50 border border-amber-200 shadow-[0_10px_26px_rgba(249,115,22,0.25)]',
  futuristic: 'rounded-2xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.35)]',
};

export const DEFAULT_UPLOAD_RATE_LIMITS = {
  per_user_hourly: 1000,
  burst_per_ip_minute: 100,
  per_event_daily: 1000,
};

export type ThemePreset = typeof THEME_PRESETS[number];
