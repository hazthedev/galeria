'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from 'lucide-react';
import clsx from 'clsx';
import { greetingModalVariants, modalBackdropVariants } from '@/lib/animations';
import { hexToRgba } from '../_lib/guest-utils';

interface GuestNameModalProps {
  isOpen: boolean;
  onSubmit: (name: string, isAnonymous: boolean) => void;
  eventName: string;
  initialName?: string;
  initialAnonymous?: boolean;
  themeGradient?: string;
  themeSurface: string;
  themeSecondary: string;
  secondaryText: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceBorder: string;
  inputBackground: string;
  inputBorder: string;
  allowAnonymous?: boolean;
}

export function GuestNameModal({
  isOpen,
  onSubmit,
  eventName,
  initialName,
  initialAnonymous,
  themeGradient,
  themeSurface,
  themeSecondary,
  secondaryText,
  surfaceText,
  surfaceMuted,
  surfaceBorder,
  inputBackground,
  inputBorder,
  allowAnonymous = true,
}: GuestNameModalProps) {
  const [name, setName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName || '');
    setIsAnonymous(allowAnonymous ? !!initialAnonymous : false);
    setError('');
  }, [isOpen, initialName, initialAnonymous, allowAnonymous]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = () => {
    if (!isAnonymous && !name.trim()) {
      setError('Please enter your name or choose anonymous');
      return;
    }
    onSubmit(isAnonymous ? '' : name.trim(), isAnonymous);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          variants={greetingModalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder }}
        >
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: themeSecondary }}
            >
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: surfaceText }}>
              Welcome to {eventName}!
            </h2>
            <p className="mt-2 text-sm" style={{ color: surfaceMuted }}>
              Please enter your name to get started
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: surfaceText }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="John Doe"
                disabled={isAnonymous}
                className={clsx(
                  'w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500',
                  isAnonymous ? 'text-gray-400' : ''
                )}
                style={{
                  backgroundColor: inputBackground,
                  borderColor: inputBorder,
                  color: surfaceText,
                  opacity: isAnonymous ? 0.7 : 1,
                }}
                maxLength={100}
              />
            </div>

            {allowAnonymous ? (
              <label
                className="flex items-center gap-3 cursor-pointer rounded-lg border p-3"
                style={{ borderColor: inputBorder, backgroundColor: inputBackground }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    setError('');
                  }}
                  className="h-4 w-4 rounded focus:ring-2"
                  style={{ borderColor: inputBorder, color: themeSecondary }}
                />
                <div>
                  <span className="text-sm font-medium" style={{ color: surfaceText }}>
                    Stay Anonymous
                  </span>
                  <p className="text-xs" style={{ color: surfaceMuted }}>
                    Your name won&apos;t be shown on photos
                  </p>
                </div>
              </label>
            ) : (
              <div
                className="rounded-lg border p-3 text-xs"
                style={{ borderColor: surfaceBorder, backgroundColor: inputBackground, color: surfaceMuted }}
              >
                Anonymous uploads are disabled for this event.
              </div>
            )}

            {isAnonymous && (
              <div className="rounded-lg p-3" style={{ backgroundColor: hexToRgba('#F59E0B', 0.15) }}>
                <p className="text-xs" style={{ color: '#F59E0B' }}>
                  ?????? Anonymous users cannot participate in the lucky draw
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              className="w-full rounded-lg py-3 text-sm font-semibold transition-all"
              style={{ backgroundColor: themeSecondary, color: secondaryText }}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
