// ============================================
// Galeria - Attendance Stats Route Alias
// ============================================
// Compatibility alias for:
// /api/events/[eventId]/attendance-stats

import { GET as LegacyGetAttendanceStats } from '../../attendance-stats/route';

export const runtime = 'nodejs';

export const GET = LegacyGetAttendanceStats;
