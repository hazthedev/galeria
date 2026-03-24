// ============================================
// Galeria - Slot Machine Draw Animation
// ============================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface SlotMachineAnimationProps {
  durationSeconds: number;
  numberString: string;
  participantName?: string;
  photoUrl?: string | null;
  prizeName?: string;
  onComplete?: () => void;
  showSelfie?: boolean;
  showFullName?: boolean;
}

const CHARSET = '0123456789ABCDEF';

const getInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  const first = parts[0]?.[0] || '?';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return `${first}${last}`.toUpperCase();
};

export function SlotMachineAnimation({
  durationSeconds,
  numberString,
  participantName,
  photoUrl,
  prizeName,
  onComplete,
  showSelfie = true,
  showFullName = true,
}: SlotMachineAnimationProps) {
  const target = useMemo(() => {
    const clean = numberString.replace(/\s+/g, '').toUpperCase();
    return clean.length > 0 ? clean : '----';
  }, [numberString]);

  const [display, setDisplay] = useState(target);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const durationMs = Math.max(2000, durationSeconds * 1000);
    const intervalMs = 70;
    const totalChars = target.length;

    const randomChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

    const interval = setInterval(() => {
      const next = Array.from({ length: totalChars }, () => randomChar()).join('');
      setDisplay(next);
    }, intervalMs);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplay(target);
      setStopped(true);
      if (onComplete) {
        setTimeout(onComplete, 800);
      }
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [durationSeconds, onComplete, target]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Prize label */}
      {prizeName && (
        <div
          className="flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--g-primary) 15%, transparent)',
          }}
        >
          <Trophy className="h-3.5 w-3.5" style={{ color: 'var(--g-primary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--g-primary)' }}>
            {prizeName}
          </p>
        </div>
      )}

      {/* Slot reels */}
      <div
        className="rounded-2xl px-5 py-6 sm:px-8"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--g-primary) 8%, var(--g-surface))',
          boxShadow: `0 0 0 1px color-mix(in srgb, var(--g-primary) 20%, transparent), 0 8px 32px color-mix(in srgb, var(--g-primary) 12%, transparent)`,
        }}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {display.split('').map((char, index) => (
            <div
              key={`${char}-${index}`}
              className={clsx(
                'flex h-14 w-10 items-center justify-center rounded-xl text-2xl font-black tracking-tight sm:h-16 sm:w-12 sm:text-3xl',
                'transition-all duration-200',
                stopped && 'scale-105',
              )}
              style={{
                backgroundColor: 'var(--g-input-bg)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: stopped
                  ? 'var(--g-primary)'
                  : 'color-mix(in srgb, var(--g-primary) 25%, transparent)',
                color: stopped ? 'var(--g-primary)' : 'var(--g-text)',
                boxShadow: stopped
                  ? '0 0 16px color-mix(in srgb, var(--g-primary) 25%, transparent), inset 0 -4px 12px color-mix(in srgb, var(--g-primary) 8%, transparent)'
                  : 'inset 0 -6px 16px rgba(0,0,0,0.08)',
              }}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {stopped ? (
            <Sparkles className="h-3 w-3" style={{ color: 'var(--g-primary)' }} />
          ) : (
            <span
              className="inline-block h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: 'var(--g-secondary)' }}
            />
          )}
          <p
            className="text-xs font-medium"
            style={{ color: stopped ? 'var(--g-primary)' : 'var(--g-muted)' }}
          >
            {stopped ? 'Winner locked in' : 'Rolling...'}
          </p>
        </div>
      </div>

      {/* Winner reveal */}
      {stopped && (showSelfie || showFullName) && (
        <div
          className="flex flex-col items-center gap-3 rounded-xl px-6 py-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--g-secondary) 10%, transparent)',
          }}
        >
          {showSelfie && (
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-lg font-bold"
              style={{
                backgroundImage: photoUrl
                  ? `url(${photoUrl})`
                  : `linear-gradient(135deg, var(--g-primary), var(--g-secondary))`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
              }}
            >
              {!photoUrl && getInitials(participantName)}
            </div>
          )}
          {showFullName && participantName && (
            <p className="text-base font-bold tracking-tight" style={{ color: 'var(--g-text)' }}>
              {participantName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
