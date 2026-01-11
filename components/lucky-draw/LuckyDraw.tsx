// ============================================
// MOMENTIQUE - Main Lucky Draw Component
// ============================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface LuckyDrawProps {
  isOrganizer: boolean;
  onStart?: () => void;
  onWinnerAnnounced?: (winner: Winner) => void;
}

interface Winner {
  participant_name: string;
  selfie_url: string;
  prize_tier: number;
}

interface AnimationConfig {
  style: 'slot_machine' | 'spinning_wheel' | 'card_shuffle' | 'drum_roll' | 'random_fade';
  duration: number;
  showSelfie: boolean;
  showName: boolean;
  playSound: boolean;
  confetti: boolean;
  numberOfWinners: number;
}

// ============================================
// ANIMATION COMPONENTS
// ============================================

// Slot Machine Animation
function SlotMachineAnimation({
  duration = 5,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [reels, setReels] = useState<string[]>(['?', '?', '?']);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    if (!isSpinning) return;

    const interval = setInterval(() => {
      setReels((prev) =>
        prev.map(() => {
          const symbols = ['?', '?', '?', '?', '?', '?'];
          return symbols[Math.floor(Math.random() * symbols.length)];
        })
      );
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      onComplete?.();
    }, duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, duration, onComplete]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex gap-8">
        {reels.map((reel, index) => (
          <div
            key={index}
            className={cn(
              'w-32 h-48 flex items-center justify-center text-6xl',
              isSpinning && 'animate-spin'
            )}
          >
            {reel}
          </div>
        ))}
      </div>
    </div>
  );
}

// Spinning Wheel Animation
function SpinningWheelAnimation({
  duration = 8,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    if (!isSpinning) return;

    const spinDuration = duration * 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= spinDuration) {
        setIsSpinning(false);
        onComplete?.();
        return;
      }

      const progress = elapsed / spinDuration;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const totalRotation = 360 * 5;
      const currentRotation = easeOut * totalRotation;

      setRotation(currentRotation);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isSpinning, duration, onComplete]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-96 h-96 rounded-full relative"
        style={{
          background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #F59E0B, #8B5CF6)',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center">
            {isSpinning ? (
              <span className="text-2xl font-bold">?</span>
            ) : (
              <span className="text-2xl font-bold">!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Card Shuffle Animation
function CardShuffleAnimation({
  duration = 6,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [isShuffling, setIsShuffling] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isShuffling) return;

    const shuffleDuration = (duration - 1) * 1000;

    const timeout = setTimeout(() => {
      setIsShuffling(false);
      setTimeout(() => {
        setShowReveal(true);
        onCompleteRef.current?.();
      }, 1000);
    }, shuffleDuration);

    return () => {
      clearTimeout(timeout);
    };
  }, [isShuffling, duration]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-64 h-96">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'w-24 h-32 bg-white rounded-lg shadow-xl border-4 border-purple-500 flex items-center justify-center transition-all duration-500',
              showReveal && 'scale-150'
            )}
          >
            <span className="text-4xl">{showReveal ? '?' : '?'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Drum Roll Animation
function DrumRollAnimation({
  duration = 10,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const entries = ['?', '?', '?', '?', '?'];

  useEffect(() => {
    if (!isRolling) return;

    const rollDuration = duration * 1000;
    const interval = 50;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entries.length);
    }, interval);

    const timeout = setTimeout(() => {
      clearInterval(intervalId);
      setIsRolling(false);
      setTimeout(() => {
        setShowReveal(true);
        onCompleteRef.current?.();
      }, 2000);
    }, rollDuration);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeout);
    };
  }, [isRolling, duration, entries.length]);

  const entry = entries[currentIndex];

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="flex items-center justify-center">
          <div className="relative w-80 h-80 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  'text-4xl font-bold text-white transition-all duration-100',
                  showReveal && 'scale-125'
                )}
              >
                {entry}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Random Fade Animation
function RandomFadeAnimation({
  duration = 3,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  const entries = ['?', '?', '?', '?', '?'];

  useEffect(() => {
    if (!isRolling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entries.length);
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      setShowReveal(true);
      onComplete?.();
    }, duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRolling, duration, entries.length]);

  const entry = entries[currentIndex];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div
          className={cn(
            'text-6xl font-bold mb-4 transition-all duration-300',
            showReveal && 'scale-150'
          )}
        >
          {entry}
        </div>
      </div>
    </div>
  );
}

// ============================================
// LUCKY DRAW COMPONENT
// ============================================

export function LuckyDraw({
  isOrganizer = false,
  onStart,
  onWinnerAnnounced,
}: LuckyDrawProps) {
  const [showDraw, setShowDraw] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winner] = useState<Winner | null>(null);

  const [animationStyle] = useState<AnimationConfig['style']>('spinning_wheel');
  const [duration] = useState(8);

  const handleStartDraw = () => {
    setShowDraw(true);
    setShowConfetti(false);
    onStart?.();
  };

  useEffect(() => {
    if (winner && !showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [winner, showConfetti]);

  if (!showDraw) {
    return (
      <button
        onClick={handleStartDraw}
        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Sparkles className="h-5 w-5" />
        Start Lucky Draw
      </button>
    );
  }

  const AnimationComponent = {
    slot_machine: SlotMachineAnimation,
    spinning_wheel: SpinningWheelAnimation,
    card_shuffle: CardShuffleAnimation,
    drum_roll: DrumRollAnimation,
    random_fade: RandomFadeAnimation,
  }[animationStyle];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isOrganizer ? 'Control Panel' : '? Lucky Draw'}
          </h2>
          {isOrganizer && (
            <button
              onClick={() => setShowDraw(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Animation */}
        <div className="flex items-center justify-center mb-8">
          <AnimationComponent
            duration={duration}
            onComplete={() => {
              setShowConfetti(true);
              onWinnerAnnounced?.(winner!);
            }}
          />
        </div>

        {/* Winner Information */}
        {winner && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">Congratulations to:</p>
            <h3 className="text-3xl font-bold text-purple-600">
              {winner.participant_name}
            </h3>
            <p className="text-sm text-gray-500">
              {winner.prize_tier === 1 ? '?' : ''}
              {winner.prize_tier === 2 ? '?' : ''}
              {winner.prize_tier === 3 ? '?' : ''}
              {winner.prize_tier === 4 ? '?' : ''}
              Grand Prize Winner
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
