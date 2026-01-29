// ============================================
// Gatherly - Lucky Draw Animation Components
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { playDrumRoll, playRevealSound, stopDrumRoll } from '@/lib/sounds';

interface DrawAnimationProps {
  style: string;
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
  playSound?: boolean;
}

export function DrawAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
  playSound = false,
}: DrawAnimationProps) {
  const [countdown, setCountdown] = useState(3);
  const [showWinner, setShowWinner] = useState(false);
  const [currentName, setCurrentName] = useState('?');

  // Get random names to show during countdown
  const getNames = (): string[] => {
    if (entries && entries.length > 0) {
      return entries.map(e => e.participantName?.trim() || '???');
    }
    return ['?', '?', '?', '?', '?', '?'];
  };

  const names = getNames();

  useEffect(() => {
    // Quick 3-second countdown (not the full duration)
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cycle through names randomly
    const nameInterval = setInterval(() => {
      setCurrentName(names[Math.floor(Math.random() * names.length)]);
    }, 80);

    // Reveal winner after 3 seconds
    const timeout = setTimeout(() => {
      clearInterval(countInterval);
      clearInterval(nameInterval);
      setCountdown(0);
      setShowWinner(true);
      setCurrentName(participantName || 'Winner');

      if (playSound) {
        stopDrumRoll();
        playRevealSound();
      }

      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 3000);

    return () => {
      clearInterval(countInterval);
      clearInterval(nameInterval);
      clearTimeout(timeout);
      if (playSound) stopDrumRoll();
    };
  }, [playSound, participantName, names]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {prizeName && (
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Drawing for: <span className="font-bold text-violet-600"> {prizeName}</span>
        </p>
      )}

      {!showWinner ? (
        <>
          {/* Quick 3-second countdown */}
          <div className="text-9xl font-black text-violet-600 mb-8">
            {countdown}
          </div>

          {/* Cycling name */}
          <div className="text-2xl text-gray-500 dark:text-gray-400 max-w-md text-center animate-pulse">
            {currentName}
          </div>
        </>
      ) : (
        <>
          {/* Winner Reveal */}
          <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
            <div className="rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1">
              <div className="rounded-full bg-white p-2">
                <Crown className="h-16 w-16 text-yellow-500" />
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center">
              {participantName || 'Winner!'}
            </h2>

            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Congratulations!</span>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
