// ============================================
// Galeria - Attendance Export Route Alias
// ============================================
// Compatibility alias for:
// /api/events/[eventId]/attendance-export

import { GET as LegacyGetAttendanceExport } from '../../attendance-export/route';

export const runtime = 'nodejs';

export const GET = LegacyGetAttendanceExport;
