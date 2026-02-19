'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AnimationStyle, LuckyDrawEntry, Winner } from '@/lib/types';
import { DrawAnimation } from '@/components/lucky-draw/DrawAnimation';

interface WinnerModalProps {
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

  const displayWinners = [...winners].reverse();
  const currentWinner = displayWinners[currentIndex];

  const advanceToNext = () => {
    if (currentIndex < winners.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowWinner(false);
      setIsAnimating(true);
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

  const skipToEnd = () => {
    setShowAllWinners(true);
    setIsAnimating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-pink-900/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          Close
        </button>

        {!showAllWinners ? (
          <>
            {!isAnimating && !showWinner && (
              <div className="p-8 text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                  Ready to Reveal: <span className="text-violet-600 font-bold">{currentWinner?.prizeName}</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowWinner(false);
                      setIsAnimating(true);
                    }}
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
              <div className="p-8">
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
              <div className="p-8 text-center">
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
          <div className="p-8">
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
              onClick={onClose}
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
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
