'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AnimationStyle, LuckyDrawEntry, Winner } from '@/lib/types';
import { DrawAnimation } from '@/components/lucky-draw/DrawAnimation';

interface WinnerModalProps {
  eventId: string;
  winners: Winner[];
  animationStyle: AnimationStyle;
  animationDuration: number;
  showSelfie: boolean;
  showFullName: boolean;
  confettiAnimation: boolean;
  playSound: boolean;
  entries: LuckyDrawEntry[];
  onClose: () => void;
}

export function WinnerModal({
  eventId,
  winners,
  animationStyle,
  animationDuration,
  showSelfie,
  showFullName,
  confettiAnimation,
  playSound,
  entries,
  onClose,
}: WinnerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showAllWinners, setShowAllWinners] = useState(false);
  const [hasStartedReveal, setHasStartedReveal] = useState(false);

  const displayWinners = [...winners].reverse();
  const currentWinner = displayWinners[currentIndex];

  const revealedCountRef = useRef(0);

  const broadcastReveal = async (
    type: 'draw_started' | 'draw_winner' | 'draw_cancelled',
    winner?: Winner
  ) => {
    try {
      const payload: Record<string, unknown> = { type };
      if (type === 'draw_winner' && winner) {
        payload.winner = {
          id: winner.id,
          entryId: winner.entryId,
          participantName: winner.participantName,
          selfieUrl: winner.selfieUrl,
          prizeTier: winner.prizeTier,
        };
      }
      await fetch(`/api/events/${eventId}/lucky-draw/reveal`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Broadcast is best-effort — don't block the organizer flow
    }
  };

  const handleClose = () => {
    // Always cancel on guest side unless all winners were revealed —
    // draw_started was already broadcast when the draw was executed
    if (revealedCountRef.current < winners.length) {
      void broadcastReveal('draw_cancelled');
    }
    onClose();
  };

  const startReveal = async () => {
    setShowWinner(false);
    setIsAnimating(true);
    setHasStartedReveal(true);
    // Broadcast this winner so guest page animates simultaneously
    if (currentWinner) {
      revealedCountRef.current++;
      await broadcastReveal('draw_winner', currentWinner);
    }
  };

  const advanceToNext = () => {
    if (currentIndex < winners.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowWinner(false);
      setIsAnimating(true);
      // Broadcast next winner
      const nextWinner = displayWinners[currentIndex + 1];
      if (nextWinner) {
        revealedCountRef.current++;
        void broadcastReveal('draw_winner', nextWinner);
      }
    } else {
      setIsAnimating(false);
      setShowAllWinners(true);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setShowWinner(true);
  };

  const formatDrawNumber = (entryId?: string | null) => {
    if (!entryId) return '----';
    const clean = entryId.replace(/-/g, '');
    if (!clean) return '----';
    return clean.slice(-4).toUpperCase().padStart(4, '0');
  };

  const skipToEnd = async () => {
    setShowAllWinners(true);
    setIsAnimating(false);
    setHasStartedReveal(true);
    // Broadcast all remaining winners
    for (let i = currentIndex; i < displayWinners.length; i++) {
      const w = displayWinners[i];
      if (w) {
        revealedCountRef.current++;
        await broadcastReveal('draw_winner', w);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-pink-900/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          aria-label="Close winner modal"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-gray-400 hover:bg-white/70 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Close
        </button>

        {!showAllWinners ? (
          <>
            {!isAnimating && !showWinner && (
              <div className="p-4 text-center sm:p-8">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                  Ready to Reveal: <span className="text-violet-600 font-bold">{currentWinner?.prizeName}</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={startReveal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-violet-700 hover:to-pink-700"
                  >
                    <Trophy className="h-5 w-5" />
                    Start Reveal
                  </button>
                  <button
                    onClick={skipToEnd}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Show All Winners
                  </button>
                </div>
              </div>
            )}

            {isAnimating && (
              <div className="p-4 sm:p-8">
                <DrawAnimation
                  key={`${animationStyle}-${currentIndex}`}
                  style={animationStyle}
                  durationSeconds={animationDuration}
                  participantName={currentWinner?.participantName}
                  prizeName={currentWinner?.prizeName}
                  photoUrl={currentWinner?.selfieUrl}
                  numberString={formatDrawNumber(currentWinner?.entryId)}
                  showSelfie={showSelfie}
                  showFullName={showFullName}
                  entries={entries}
                  onComplete={handleAnimationComplete}
                  playSound={playSound}
                />
              </div>
            )}

            {showWinner && currentWinner && (
              <div className="p-4 text-center sm:p-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Winner {currentIndex + 1} of {winners.length}
                </p>
                <WinnerDisplay
                  winner={currentWinner}
                  showSelfie={showSelfie}
                  showFullName={showFullName}
                  confettiAnimation={confettiAnimation}
                />
                <button
                  onClick={advanceToNext}
                  className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-violet-700 hover:to-pink-700"
                >
                  {currentIndex < winners.length - 1 ? 'Next Winner' : 'View All Winners'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 sm:p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
              Draw Complete!
            </h2>
            <div className="space-y-4 mb-8">
              {[...winners]
                .sort((a, b) => {
                  if (Number.isFinite(a.selectionOrder) && Number.isFinite(b.selectionOrder)) {
                    return a.selectionOrder - b.selectionOrder;
                  }
                  const tierRank = {
                    grand: 0,
                    first: 1,
                    second: 2,
                    third: 3,
                    consolation: 4,
                  } as const;
                  const aRank = tierRank[a.prizeTier] ?? 99;
                  const bRank = tierRank[b.prizeTier] ?? 99;
                  return aRank - bRank;
                })
                .map((winner, idx) => (
                  <WinnerCard key={winner.id} winner={winner} rank={idx + 1} />
                ))}
            </div>

            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerCard({ winner, rank }: { winner: Winner; rank: number }) {
  const medals = ['1st', '2nd', '3rd', '4th'];
  const medal = medals[Math.min(rank - 1, medals.length - 1)];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
      <span className="text-2xl">{medal}</span>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {winner.participantName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {winner.prizeName}
        </p>
      </div>
    </div>
  );
}

function WinnerDisplay({
  winner,
  showSelfie,
  showFullName,
  confettiAnimation,
}: {
  winner: Winner;
  showSelfie: boolean;
  showFullName: boolean;
  confettiAnimation: boolean;
}) {
  useEffect(() => {
    if (confettiAnimation) {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50;
        const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366f1'];

        confetti({
          ...defaults,
          particleCount,
          colors,
          origin: { x: randomInRange(0.2, 0.8), y: Math.random() * 0.3 + 0.1 },
          angle: randomInRange(0, 360),
          spread: randomInRange(50, 70),
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [confettiAnimation]);

  const displayName = showFullName
    ? winner.participantName
    : winner.participantName.split(' ')[0] || winner.participantName;

  return (
    <div className="text-center">
      {showSelfie && winner.selfieUrl ? (
        <div className="mb-4 flex justify-center">
          <img
            src={winner.selfieUrl}
            alt={winner.participantName}
            className="h-24 w-24 rounded-full object-cover shadow-md"
          />
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <Trophy className="h-16 w-16 text-yellow-500" />
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {displayName}
      </h2>
      <p className="text-lg text-violet-600 font-semibold mb-1">
        {winner.prizeName}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Congratulations!
      </p>
    </div>
  );
}
