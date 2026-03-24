'use client';

import { useState, useRef, useEffect } from 'react';
import { Trophy, Download, Share2, MoreHorizontal, User, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Theme colors read from CSS variables (--g-*) set by GuestEventPageView
const v = {
  text: 'var(--g-text)',
  muted: 'var(--g-muted)',
  border: 'var(--g-border)',
  surface: 'var(--g-surface)',
} as const;

export interface HeaderActionsProps {
  luckyDrawEnabled: boolean;
  canDownload: boolean;
  selectedCount: number;
  guestName: string;
  isAnonymous: boolean;
  themeSecondary: string;
  secondaryText: string;
  onDownloadSelectedIndividually: () => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  onEditName: () => void;
  onShare: () => void;
}

export function HeaderActions({
  luckyDrawEnabled,
  canDownload,
  selectedCount,
  guestName,
  isAnonymous,
  themeSecondary,
  secondaryText,
  onDownloadSelectedIndividually,
  onDownloadSelected,
  onDownloadAll,
  onEditName,
  onShare,
}: HeaderActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-2">
      {/* Download selected — shown inline when selections exist */}
      {canDownload && selectedCount > 0 && (
        <button
          onClick={onDownloadSelectedIndividually}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium leading-none transition-colors duration-150 ease-out"
          style={{
            backgroundColor: themeSecondary,
            color: secondaryText,
            borderColor: v.border,
          }}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span> ({selectedCount})
        </button>
      )}

      {/* Share — always visible, primary action */}
      <button
        onClick={onShare}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: themeSecondary,
          color: secondaryText,
          boxShadow: `0 1px 3px ${themeSecondary}33, 0 4px 16px ${themeSecondary}44`,
          transition: 'all 0.15s ease-out',
        }}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {/* Overflow menu */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 ease-out"
          style={{ color: v.text, borderColor: v.border }}
          aria-label="More actions"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border shadow-lg"
              style={{ backgroundColor: v.surface, borderColor: v.border }}
            >
              <div className="py-1">
                {/* Edit name */}
                <button
                  onClick={() => { onEditName(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: v.text }}
                >
                  <User className="h-4 w-4" style={{ color: v.muted }} />
                  {isAnonymous || !guestName ? 'Add name' : 'Edit name'}
                </button>

                {/* Lucky Draw link */}
                {luckyDrawEnabled && (
                  <a
                    href="#lucky-draw"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: v.text }}
                  >
                    <Trophy className="h-4 w-4" style={{ color: v.muted }} />
                    Lucky Draw
                  </a>
                )}

                {/* Download actions */}
                {canDownload && (
                  <>
                    <div className="mx-3 my-1 border-t" style={{ borderColor: v.border }} />
                    <button
                      onClick={() => { onDownloadAll(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: v.text }}
                    >
                      <Download className="h-4 w-4" style={{ color: v.muted }} />
                      Download all photos
                    </button>
                    {selectedCount > 0 && (
                      <button
                        onClick={() => { onDownloadSelected(); setMenuOpen(false); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                        style={{ color: v.text }}
                      >
                        <Archive className="h-4 w-4" style={{ color: v.muted }} />
                        Download as ZIP ({selectedCount})
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
