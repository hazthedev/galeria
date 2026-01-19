// ============================================
// MOMENTIQUE - Lucky Draw Animation Components
// ============================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import clsx from 'clsx';
import type { AnimationStyle } from '@/lib/types';

interface DrawAnimationProps {
  style: AnimationStyle;
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
}

export function DrawAnimation({
  style,
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: DrawAnimationProps) {
  const duration = Math.max(1, durationSeconds);

  switch (style) {
    case 'slot_machine':
      return <SlotMachineAnimation durationSeconds={duration} prizeName={prizeName} participantName={participantName} entries={entries} onComplete={onComplete} />;
    case 'card_shuffle':
      return <CardShuffleAnimation durationSeconds={duration} prizeName={prizeName} participantName={participantName} entries={entries} onComplete={onComplete} />;
    case 'drum_roll':
      return <DrumRollAnimation durationSeconds={duration} prizeName={prizeName} participantName={participantName} entries={entries} onComplete={onComplete} />;
    case 'random_fade':
      return <RandomFadeAnimation durationSeconds={duration} prizeName={prizeName} participantName={participantName} entries={entries} onComplete={onComplete} />;
    case 'spinning_wheel':
    default:
      return <SpinningWheelAnimation durationSeconds={duration} prizeName={prizeName} participantName={participantName} entries={entries} onComplete={onComplete} />;
  }
}

function SlotMachineAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: {
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
}) {
  const [reels, setReels] = useState<string[]>(['?', '?', '?']);
  const [isSpinning, setIsSpinning] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Get random participant names to show during spin
  const getSpinningNames = (): string[] => {
    if (entries && entries.length > 0) {
      return entries.map(e => e.participantName?.trim() || '???');
    }
    return ['?', '?', '?', '?', '?', '?'];
  };

  const spinningNames = getSpinningNames();

  useEffect(() => {
    if (!isSpinning) return;

    const interval = setInterval(() => {
      setReels((prev) =>
        prev.map(() => spinningNames[Math.floor(Math.random() * spinningNames.length)])
      );
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      onCompleteRef.current();
    }, durationSeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, durationSeconds, spinningNames]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      {prizeName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Drawing for: <span className="font-bold text-violet-600">{prizeName}</span>
        </p>
      )}
      <div className="flex gap-6">
        {reels.map((reel, index) => (
          <div
            key={index}
            className={clsx(
              'w-24 h-32 rounded-xl border border-violet-200 bg-gradient-to-b from-white to-violet-50',
              'flex items-center justify-center text-xl font-semibold text-violet-700 shadow-sm'
            )}
          >
            {reel.length > 8 ? reel.slice(0, 8) + '…' : reel}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinningWheelAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: {
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
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

  // Get participant names from entries for the wheel
  // Use up to 8 entries on the wheel, or use sample names if no entries
  const getWheelLabels = (): string[] => {
    if (entries && entries.length > 0) {
      // Use actual participant names, up to 8 on the wheel
      const maxSegments = Math.min(8, entries.length);
      const shuffled = [...entries].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, maxSegments).map(entry =>
        entry.participantName?.trim() || `Entry ${entry.id.slice(0, 6)}`
      );
    }
    // Fallback sample names if no entries
    return ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  };

  const labels = getWheelLabels();

  // Create wheel segments with colors and participant names
  const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
  const segments = labels.map((label, index) => ({
    color: colors[index % colors.length],
    label,
  }));

  const segmentAngle = 360 / segments.length;

  // Build SVG paths and text for all segments
  const svgElements = segments.map((segment, index) => {
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    const midAngle = startAngle + segmentAngle / 2;

    // Convert polar to cartesian coordinates for text positioning
    const radius = 90; // percentage from center
    const angleInRadians = (midAngle - 90) * (Math.PI / 180);
    const x = 50 + radius * Math.cos(angleInRadians);
    const y = 50 + radius * Math.sin(angleInRadians);

    return {
      path: describeArc(50, 50, 50, startAngle, endAngle),
      color: segment.color,
      label: segment.label,
      x,
      y,
      midAngle,
    };
  });

  return (
    <div className="flex items-center justify-center py-10">
      <div className="relative">
        {/* Prize info above wheel */}
        {prizeName && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drawing for:</p>
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{prizeName}</p>
          </div>
        )}

        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="h-8 w-8 rounded-full bg-white shadow-lg border-4 border-violet-600" />
        </div>

        {/* Spinning Wheel */}
        <div
          className="relative h-72 w-72 rounded-full shadow-2xl overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            {svgElements.map((element, index) => (
              <g key={index}>
                {/* Segment */}
                <path
                  d={element.path}
                  fill={element.color}
                  stroke="white"
                  strokeWidth="0.5"
                />
                {/* Text label */}
                <text
                  x={element.x}
                  y={element.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3"
                  fontWeight="bold"
                  fill="white"
                  style={{
                    transform: `rotate(${element.midAngle} ${element.x} ${element.y})`,
                    transformOrigin: `${element.x}px ${element.y}px`,
                  }}
                >
                  {element.label.length > 10 ? element.label.slice(0, 10) + '…' : element.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Center circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-16 w-16 rounded-full bg-white shadow-xl flex items-center justify-center">
            <Trophy className="h-8 w-8 text-violet-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to create SVG arc path
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");

  return d;
}

function CardShuffleAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: {
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
}) {
  const [isShuffling, setIsShuffling] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const [currentName, setCurrentName] = useState('?');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Get random participant names to show during shuffle
  const getNames = (): string[] => {
    if (entries && entries.length > 0) {
      return entries.map(e => e.participantName?.trim() || '???');
    }
    return ['?', '?', '?', '?', '?', '?'];
  };

  const names = getNames();

  useEffect(() => {
    if (!isShuffling) return;

    const interval = setInterval(() => {
      setCurrentName(names[Math.floor(Math.random() * names.length)]);
    }, 100);

    const shuffleDuration = Math.max(1, durationSeconds - 1) * 1000;

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsShuffling(false);
      setShowReveal(true);
      onCompleteRef.current();
    }, shuffleDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isShuffling, durationSeconds, names]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      {prizeName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Drawing for: <span className="font-bold text-violet-600">{prizeName}</span>
        </p>
      )}
      <div className="relative h-48 w-36">
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
            'absolute inset-0 rounded-xl border-2 border-violet-500 bg-white shadow-lg flex items-center justify-center text-lg font-semibold text-violet-700',
            showReveal && 'scale-105'
          )}
        >
          {showReveal && participantName ? participantName.slice(0, 15) + (participantName.length > 15 ? '…' : '') : currentName}
        </div>
      </div>
    </div>
  );
}

function DrumRollAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: {
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const getNames = (): string[] => {
    if (entries && entries.length > 0) {
      return entries.map(e => e.participantName?.trim() || '???');
    }
    return ['?', '?', '?', '?', '?'];
  };

  const namesList = getNames();

  useEffect(() => {
    if (!isRolling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % namesList.length);
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
  }, [isRolling, durationSeconds, namesList.length]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      {prizeName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Drawing for: <span className="font-bold text-violet-600">{prizeName}</span>
        </p>
      )}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 px-12 py-10 shadow-2xl">
        <div className="text-3xl font-bold text-white text-center">
          {isRolling ? (
            namesList[currentIndex]
          ) : (
            <span className="text-2xl">
              {participantName || 'Winner'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RandomFadeAnimation({
  durationSeconds,
  prizeName,
  participantName,
  entries,
  onComplete,
}: {
  durationSeconds: number;
  prizeName?: string;
  participantName?: string;
  entries?: Array<{ participantName?: string | null; id: string }>;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const onCompleteRef = useRef(onComplete);

  const getNames = (): string[] => {
    if (entries && entries.length > 0) {
      return entries.map(e => e.participantName?.trim() || '???');
    }
    return ['?', '?', '?', '?', '?'];
  };

  const namesList = getNames();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % namesList.length);
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
  }, [durationSeconds, namesList.length]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      {prizeName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Drawing for: <span className="font-bold text-violet-600">{prizeName}</span>
        </p>
      )}
      <div
        className={clsx(
          'text-5xl font-semibold text-violet-700 transition-transform duration-300',
          showReveal && 'scale-110'
        )}
      >
        {showReveal ? (
          <span className="text-4xl">
            {participantName || 'Winner'}
          </span>
        ) : (
          namesList[currentIndex]
        )}
      </div>
    </div>
  );
}
