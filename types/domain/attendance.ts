// ============================================
// Attendance Domain Types
// ============================================

export type CheckInMethod = 'guest_self' | 'guest_qr' | 'organizer_manual' | 'organizer_qr';

export interface IAttendance {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  user_fingerprint?: string | null;
  companions_count: number;
  check_in_time: Date;
  check_in_method: CheckInMethod;
  checked_in_by?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export interface IAttendanceCreate {
  event_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  user_fingerprint?: string;
  companions_count?: number;
  check_in_method?: CheckInMethod;
  notes?: string;
}

export interface IAttendanceStats {
  total_check_ins: number;
  total_guests: number; // Including companions
  check_ins_today: number;
  unique_guests: number;
  average_companions: number;
  check_in_method_breakdown: Record<CheckInMethod, number>;
}
