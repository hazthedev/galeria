// ============================================
// Galeria - Lucky Draw Config Route Alias
// ============================================
// Compatibility alias for legacy path:
// /api/events/:eventId/lucky-draw/config

import {
  GET as LegacyGetConfig,
  POST as LegacyPostConfig,
  PUT as LegacyPutConfig,
} from '../../lucky-draw-config/route';

export const runtime = 'nodejs';

export const GET = LegacyGetConfig;
export const POST = LegacyPostConfig;
export const PUT = LegacyPutConfig;
