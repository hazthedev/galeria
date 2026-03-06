// ============================================
// Photo Challenge All Progress Route Alias
// ============================================
// Compatibility alias for:
// /api/events/[eventId]/photo-challenge/progress/all

import { GET as LegacyGetProgressAll } from '../../../challenge-progress-all/route';

export const runtime = 'nodejs';

export const GET = LegacyGetProgressAll;
