// ============================================
// MOMENTIQUE - Lucky Draw Animation Components
// ============================================

'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { AnimationStyle } from '@/lib/types';

interface DrawAnimationProps {
  style: AnimationStyle;
  durationSeconds: number;
  onComplete: () => void;
}

export function DrawAnimation({
  style,
  durationSeconds,
  onComplete,
}: DrawAnimationProps) {
  const duration = Math.max(1, durationSeconds);

  switch (style) {
    case 'slot_machine':
      return <SlotMachineAnimation durationSeconds={duration} onComplete={onComplete} />;
    case 'card_shuffle':
      return <CardShuffleAnimation durationSeconds={duration} onComplete={onComplete} />;
    case 'drum_roll':
      return <DrumRollAnimation durationSeconds={duration} onComplete={onComplete} />;
    case 'random_fade':
      return <RandomFadeAnimation durationSeconds={duration} onComplete={onComplete} />;
    case 'spinning_wheel':
    default:
      return <SpinningWheelAnimation durationSeconds={duration} onComplete={onComplete} />;
  }
}

function SlotMachineAnimation({
  durationSeconds,
  onComplete,
}: {
  durationSeconds: number;
  onComplete: () => void;
}) {
  const [reels, setReels] = useState<string[]>(['?', '?', '?']);
  const [isSpinning, setIsSpinning] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isSpinning) return;

    const interval = setInterval(() => {
      setReels((prev) =>
        prev.map(() => {
          const symbols = ['?', '?', '?', '?', '?', '?'];
          return symbols[Math.floor(Math.random() * symbols.length)];
        })
      );
    }, 120);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      onCompleteRef.current();
    }, durationSeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, durationSeconds]);

  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex gap-6">
        {reels.map((reel, index) => (
          <div
            key={index}
            className={clsx(
              'w-20 h-28 rounded-xl border border-violet-200 bg-gradient-to-b from-white to-violet-50',
              'flex items-center justify-center text-3xl font-semibold text-violet-700 shadow-sm'
            )}
          >
            {reel}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinningWheelAnimation({
  durationSeconds,
  onComplete,
}: {
  durationSeconds: number;
  onComplete: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const spinDuration = durationSeconds * 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= spinDuration) {
        onCompleteRef.current();
        return;
      }

      const progress = elapsed / spinDuration;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const totalRotation = 360 * 4;
      setRotation(easeOut * totalRotation);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [durationSeconds]);

  return (
    <div className="flex items-center justify-center py-10">
      <div
        className="relative h-64 w-64 rounded-full shadow-xl"
        style={{
          background: 'conic-gradient(from 0deg, #7C3AED, #EC4899, #F59E0B, #7C3AED)',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="absolute -top-2 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 bg-white shadow-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl font-semibold text-violet-700">
            ?
          </div>
        </div>
      </div>
    </div>
  );
}

function CardShuffleAnimation({
  durationSeconds,
  onComplete,
}: {
  durationSeconds: number;
  onComplete: () => void;
}) {
  const [isShuffling, setIsShuffling] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const shuffleDuration = Math.max(1, durationSeconds - 1) * 1000;

    const timeout = setTimeout(() => {
      setIsShuffling(false);
      setShowReveal(true);
      onCompleteRef.current();
    }, shuffleDuration);

    return () => clearTimeout(timeout);
  }, [durationSeconds]);

  return (
    <div className="flex items-center justify-center py-10">
      <div className="relative h-48 w-32">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={clsx(
              'absolute inset-0 rounded-xl border border-violet-200 bg-white shadow-md',
              isShuffling && index === 1 && 'rotate-6',
              isShuffling && index === 2 && '-rotate-6'
            )}
          />
        ))}
        <div
          className={clsx(
            'absolute inset-0 rounded-xl border-2 border-violet-500 bg-white shadow-lg flex items-center justify-center text-3xl font-semibold text-violet-700',
            showReveal && 'scale-105'
          )}
        >
          ?
        </div>
      </div>
    </div>
  );
}

function DrumRollAnimation({
  durationSeconds,
  onComplete,
}: {
  durationSeconds: number;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const entries = ['?', '?', '?', '?', '?'];

  useEffect(() => {
    if (!isRolling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entries.length);
    }, 70);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      onCompleteRef.current();
    }, durationSeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRolling, durationSeconds, entries.length]);

  return (
    <div className="flex items-center justify-center py-10">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 px-12 py-10 shadow-2xl">
        <div className="text-4xl font-bold text-white">
          {entries[currentIndex]}
        </div>
      </div>
    </div>
  );
}

function RandomFadeAnimation({
  durationSeconds,
  onComplete,
}: {
  durationSeconds: number;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const entries = ['?', '?', '?', '?', '?'];

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entries.length);
    }, 180);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowReveal(true);
      onCompleteRef.current();
    }, durationSeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [durationSeconds, entries.length]);

  return (
    <div className="flex items-center justify-center py-10">
      <div
        className={clsx(
          'text-5xl font-semibold text-violet-700 transition-transform duration-300',
          showReveal && 'scale-110'
        )}
      >
        {entries[currentIndex]}
      </div>
    </div>
  );
}
