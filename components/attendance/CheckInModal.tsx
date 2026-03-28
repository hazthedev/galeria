// ============================================
// Galeria - Check-in Modal Component
// ============================================

'use client';

import { useState } from 'react';
import { User, Mail, Phone, Users, X, Minus, Plus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { getClientFingerprint } from '@/lib/rate-limit';

interface CheckInModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess?: (attendance: unknown) => void;
}

export function CheckInModal({ eventId, onClose, onSuccess }: CheckInModalProps) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [companionsCount, setCompanionsCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fingerprint = getClientFingerprint();
      if (!fingerprint) {
        throw new Error('Unable to identify your device for check-in');
      }

      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint,
        },
        credentials: 'include',
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail || undefined,
          guest_phone: guestPhone || undefined,
          user_fingerprint: fingerprint,
          companions_count: companionsCount,
          check_in_method: 'guest_self',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast.success('Checked in successfully!');
      onSuccess?.(data.data);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: 'var(--g-surface)', color: 'var(--g-text)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div
            className="relative px-6 pb-4 pt-5"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--g-primary), var(--g-secondary))`,
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Check In</h3>
                <p className="text-xs text-white/70">Mark your attendance</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-5">
            {/* Name field */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: 'var(--g-text)' }}
              >
                Name <span style={{ color: 'var(--g-primary)' }}>*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--g-muted)' }}
                />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--g-input-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--g-input-border)',
                    color: 'var(--g-text)',
                  }}
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: 'var(--g-text)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--g-muted)' }}
                />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--g-input-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--g-input-border)',
                    color: 'var(--g-text)',
                  }}
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone field */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: 'var(--g-text)' }}
              >
                Phone
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--g-muted)' }}
                />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--g-input-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--g-input-border)',
                    color: 'var(--g-text)',
                  }}
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Companions counter */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: 'var(--g-text)' }}
              >
                Additional Guests
              </label>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" style={{ color: 'var(--g-muted)' }} />
                <button
                  type="button"
                  onClick={() => setCompanionsCount(Math.max(0, companionsCount - 1))}
                  disabled={isSubmitting || companionsCount === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--g-border)', color: 'var(--g-text)' }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  className="w-10 text-center text-lg font-bold tabular-nums"
                  style={{ color: 'var(--g-text)' }}
                >
                  {companionsCount}
                </span>
                <button
                  type="button"
                  onClick={() => setCompanionsCount(companionsCount + 1)}
                  disabled={isSubmitting}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--g-border)', color: 'var(--g-text)' }}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="ml-1 text-sm" style={{ color: 'var(--g-muted)' }}>
                  people with you
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !guestName.trim()}
              className={clsx(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-tight transition-all duration-150',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              style={{
                backgroundImage:
                  isSubmitting || !guestName.trim()
                    ? 'none'
                    : `linear-gradient(135deg, var(--g-primary), var(--g-secondary))`,
                backgroundColor:
                  isSubmitting || !guestName.trim() ? 'var(--g-border)' : undefined,
                color:
                  isSubmitting || !guestName.trim() ? 'var(--g-muted)' : '#fff',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Check In
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
