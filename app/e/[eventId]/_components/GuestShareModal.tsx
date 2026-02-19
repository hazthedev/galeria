'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { modalBackdropVariants, modalContentVariants } from '@/lib/animations';

type GuestShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  shareUrl: string;
  themeSurface: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceBorder: string;
  inputBackground: string;
};

export function GuestShareModal({
  isOpen,
  onClose,
  onCopyLink,
  shareUrl,
  themeSurface,
  surfaceText,
  surfaceMuted,
  surfaceBorder,
  inputBackground,
}: GuestShareModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: surfaceText }}>
                  Share Event
                </h3>
                <button onClick={onClose} className="hover:opacity-80" style={{ color: surfaceMuted }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-sm" style={{ color: surfaceMuted }}>
                Share this link with guests to let them view and upload photos:
              </p>
              <div
                className="mb-4 flex items-center gap-2 rounded-lg border p-3"
                style={{ borderColor: surfaceBorder, backgroundColor: inputBackground }}
              >
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: surfaceText }}
                />
                <button
                  onClick={onCopyLink}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Copy Link
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
