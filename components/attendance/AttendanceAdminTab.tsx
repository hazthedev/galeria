// ============================================
// Galeria - Attendance Admin Tab Component
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Users, Download, Upload, UserPlus, Search, ChevronLeft, ChevronRight, QrCode, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { OrganizerQRScanner } from '@/components/attendance/OrganizerQRScanner';
import {
  AttendanceGuestListSkeleton,
  AttendanceOverviewSkeleton,
} from '@/components/events/admin-tab-skeletons';
import { generateCheckInUrl, generateCheckInQRCodeUrl } from '@/lib/utils';

interface AttendanceAdminTabProps {
  eventId: string;
  initialTab?: AdminSubTab;
  attendanceEnabled?: boolean;
}

interface AttendanceRecord {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  companions_count: number;
  check_in_time: string;
  check_in_method: string;
}

interface AttendanceStats {
  total_check_ins: number;
  total_guests: number;
  check_ins_today: number;
  unique_guests: number;
  average_companions: number;
  check_in_method_breakdown: Record<string, number>;
}

type AdminSubTab = 'overview' | 'guests' | 'manual' | 'import' | 'qr';

export function AttendanceAdminTab({ eventId, initialTab, attendanceEnabled = true }: AttendanceAdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(initialTab || 'overview');
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isGuestsLoading, setIsGuestsLoading] = useState(false);
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // QR Code state
  const [copiedLink, setCopiedLink] = useState(false);
  const checkInUrl = typeof window !== 'undefined' ? generateCheckInUrl(eventId) : '';
  const qrCodeUrl = generateCheckInQRCodeUrl(eventId);

  // Manual entry form state
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualGuestEmail, setManualGuestEmail] = useState('');
  const [manualGuestPhone, setManualGuestPhone] = useState('');
  const [manualCompanions, setManualCompanions] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendanceStats = async (showLoading = true) => {
    if (!attendanceEnabled || featureDisabled) {
      return;
    }

    if (showLoading) {
      setIsStatsLoading(true);
    }

    try {
      const response = await fetch(`/api/events/${eventId}/attendance/stats`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setFeatureDisabled(false);
      } else {
        const errorData = await response.json().catch(() => null) as { code?: string; error?: string } | null;
        if (response.status === 400 && errorData?.code === 'FEATURE_DISABLED') {
          setFeatureDisabled(true);
          setStats(null);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      if (showLoading) {
        setIsStatsLoading(false);
      }
    }
  };

  const fetchAttendanceList = async (showLoading = true) => {
    if (!attendanceEnabled || featureDisabled) {
      return;
    }

    if (showLoading) {
      setIsGuestsLoading(true);
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/attendance?limit=50&offset=${(currentPage - 1) * 50}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        setFeatureDisabled(false);
        const data = await response.json();
        setAttendances(data.data || []);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / 50));
      } else {
        const errorData = await response.json().catch(() => null) as { code?: string; error?: string } | null;
        if (response.status === 400 && errorData?.code === 'FEATURE_DISABLED') {
          setFeatureDisabled(true);
          setAttendances([]);
          setStats(null);
          setTotalPages(1);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching attendance list:', error);
      toast.error('Failed to load attendance data');
    } finally {
      if (showLoading) {
        setIsGuestsLoading(false);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [eventId]);

  useEffect(() => {
    if (!attendanceEnabled) {
      setFeatureDisabled(true);
      setIsStatsLoading(false);
      setIsGuestsLoading(false);
      setAttendances([]);
      setStats(null);
      setTotalPages(1);
      return;
    }

    setFeatureDisabled(false);
  }, [attendanceEnabled, eventId]);

  useEffect(() => {
    if (!attendanceEnabled || featureDisabled || activeSubTab !== 'overview') {
      return;
    }

    void fetchAttendanceStats();
  }, [eventId, activeSubTab, attendanceEnabled, featureDisabled]);

  useEffect(() => {
    if (!attendanceEnabled || featureDisabled || activeSubTab !== 'guests') {
      return;
    }

    void fetchAttendanceList();
  }, [eventId, currentPage, activeSubTab, attendanceEnabled, featureDisabled]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceEnabled || featureDisabled) {
      toast.error('Attendance is disabled for this event');
      return;
    }

    if (!manualGuestName.trim()) {
      toast.error('Guest name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/attendance/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          guest_name: manualGuestName,
          guest_email: manualGuestEmail || undefined,
          guest_phone: manualGuestPhone || undefined,
          companions_count: manualCompanions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast.success('Guest checked in successfully');
      setManualGuestName('');
      setManualGuestEmail('');
      setManualGuestPhone('');
      setManualCompanions(0);
      await Promise.all([fetchAttendanceStats(false), fetchAttendanceList(false)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCheckInLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopiedLink(true);
    toast.success('Check-in link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `checkin-qr-${eventId}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded!');
  };

  const handleExport = async () => {
    if (!attendanceEnabled || featureDisabled) {
      toast.error('Attendance is disabled for this event');
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/attendance/export`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${eventId}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const filteredAttendances = attendances.filter((a) =>
    a.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.guest_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.guest_phone?.includes(searchQuery)
  );

  if (!attendanceEnabled || featureDisabled) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-amber-900 dark:text-amber-100">
        <h3 className="text-lg font-semibold">Attendance is disabled</h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
          Enable Attendance in Event Settings to use check-ins, guest lists, and attendance export.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="-mx-4 overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:mx-0">
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 pr-6 sm:gap-2 sm:px-0 sm:pr-0">
        {[
          { id: 'overview' as const, label: 'Dashboard', icon: Users },
          { id: 'guests' as const, label: 'Guest List', icon: Users },
          { id: 'manual' as const, label: 'Manual Check-in', icon: UserPlus },
          { id: 'qr' as const, label: 'QR Codes', icon: QrCode },
          { id: 'import' as const, label: 'Import/Export', icon: Upload },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={clsx(
              'flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 sm:gap-2 sm:px-4 sm:text-sm',
              activeSubTab === tab.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isStatsLoading ? (
            <div className="col-span-full">
              <AttendanceOverviewSkeleton />
            </div>
          ) : stats ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Check-ins</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total_check_ins}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Guests</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total_guests}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Including companions</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.check_ins_today}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Check-ins today</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Guests</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.unique_guests}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">With email</p>
              </div>
            </>
          ) : (
            <div className="col-span-full flex h-48 items-center justify-center text-sm text-gray-500">
              No attendance stats yet
            </div>
          )}
        </div>
      )}

      {/* Guest List Tab */}
      {activeSubTab === 'guests' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          </div>

          {isGuestsLoading ? (
            <AttendanceGuestListSkeleton />
          ) : filteredAttendances.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-gray-500">
              <Users className="mb-2 h-12 w-12 opacity-50" />
              <p>No check-ins yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filteredAttendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {attendance.guest_name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(attendance.check_in_time).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {attendance.check_in_method}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                        <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Email</dt>
                        <dd className="mt-1 break-all">{attendance.guest_email || '-'}</dd>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                        <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Phone</dt>
                        <dd className="mt-1">{attendance.guest_phone || '-'}</dd>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                        <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Companions</dt>
                        <dd className="mt-1">{attendance.companions_count}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div className="-mx-4 hidden overflow-x-auto px-4 md:block md:px-0">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Guest
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Companions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Check-in Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAttendances.map((attendance) => (
                        <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {attendance.guest_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {attendance.guest_email || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {attendance.guest_phone || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {attendance.companions_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(attendance.check_in_time).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {attendance.check_in_method}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeSubTab === 'manual' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:max-w-2xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Manual Check-in
          </h3>
          <form onSubmit={handleManualCheckIn} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={manualGuestName}
                onChange={(e) => setManualGuestName(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="Guest name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={manualGuestEmail}
                onChange={(e) => setManualGuestEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                type="tel"
                value={manualGuestPhone}
                onChange={(e) => setManualGuestPhone(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="+1 234 567 8900"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Companions
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setManualCompanions(Math.max(0, manualCompanions - 1))}
                  disabled={isSubmitting}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{manualCompanions}</span>
                <button
                  type="button"
                  onClick={() => setManualCompanions(manualCompanions + 1)}
                  disabled={isSubmitting}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
            </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !manualGuestName.trim()}
              className={clsx(
                'w-full rounded-lg py-3 font-semibold text-white transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSubmitting || !manualGuestName.trim()
                  ? 'bg-gray-400'
                  : 'bg-violet-600 hover:bg-violet-700'
              )}
            >
              {isSubmitting ? 'Checking in...' : 'Check In Guest'}
            </button>
          </form>
        </div>
      )}

      {/* QR Codes Tab */}
      {activeSubTab === 'qr' && (
        <div className="space-y-6">
          {/* QR Code Sub-tabs */}
          <div className="-mx-4 overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:mx-0">
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 pr-6 sm:gap-2 sm:px-0 sm:pr-0">
            <button
              onClick={() => setActiveSubTab('qr')}
              className={clsx(
                'flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[11px] font-medium transition-colors sm:gap-2 sm:px-4 sm:text-sm',
                'border-violet-600 text-violet-600'
              )}
            >
              <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Generate QR Code
            </button>
            </div>
          </div>

          {/* Generate QR Code Section */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* QR Code Display */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Check-in QR Code
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Share this QR code with guests. When they scan it, they&apos;ll be taken directly to the check-in page.
              </p>

              {/* QR Code Image */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-lg border-4 border-white p-4 shadow-lg dark:border-gray-700">
                  <img
                    src={qrCodeUrl}
                    alt="Event Check-in QR Code"
                    className="h-auto w-full max-w-[16rem] sm:max-w-[18rem]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </button>
              </div>
            </div>

            {/* Check-in Link */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Check-in Link
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Share this direct link with guests for quick check-in access.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Direct Link
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <code className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 break-all dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                      {checkInUrl}
                    </code>
                    <button
                      onClick={handleCopyCheckInLink}
                      className={clsx(
                        'flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                  <h4 className="mb-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
                    How to use
                  </h4>
                  <ol className="space-y-2 text-sm text-violet-800 dark:text-violet-200">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-200 text-xs font-semibold text-violet-900 dark:bg-violet-800 dark:text-violet-200">
                        1
                      </span>
                      <span>Download the QR code image</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-200 text-xs font-semibold text-violet-900 dark:bg-violet-800 dark:text-violet-200">
                        2
                      </span>
                      <span>Display it at your event venue</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-200 text-xs font-semibold text-violet-900 dark:bg-violet-800 dark:text-violet-200">
                        3
                      </span>
                      <span>Guests scan to check in instantly</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Guest QR Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scan Guest QR Code
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Scan a guest&apos;s QR code to verify their check-in status or manually check them in.
            </p>
            <OrganizerQRScanner eventId={eventId} />
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Export Attendance
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Download all attendance data as a CSV file for use in spreadsheets or other tools.
            </p>
            <button
              onClick={handleExport}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              CSV Import (Coming Soon)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bulk import guests from a CSV file
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
