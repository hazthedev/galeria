/**
 * Sound Manager for Lucky Draw
 *
 * Handles playing sound effects for:
 * - Drum roll during animation
 * - Celebration sound on winner reveal
 * - Button clicks
 */

import { Howl } from 'howler';

// ============================================
// TYPES
// ============================================

export type SoundEffect = 'drum-roll' | 'celebration' | 'click' | 'tick' | 'reveal';

export interface SoundConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

// ============================================
// SOUND REGISTRY
// ============================================

// Sound file paths
const SOUND_FILES: Record<SoundEffect, string> = {
  'drum-roll': '/sounds/drum-roll.mp3',
  'celebration': '/sounds/celebration.mp3',
  'click': '/sounds/click.mp3',
  'tick': '/sounds/tick.mp3',
  'reveal': '/sounds/reveal.mp3',
};

// Howl instances cache
const sounds: Partial<Record<SoundEffect, Howl>> = {};

// Current sound config
let config: SoundConfig = {
  enabled: true,
  volume: 0.5,
};

// Currently playing sounds (for stopping)
let currentDrumRoll: Howl | null = null;

// ============================================
// SOUND MANAGER
// ============================================

/**
 * Initialize the sound manager with config
 */
export function initSoundManager(soundConfig: SoundConfig): void {
  config = soundConfig;
}

/**
 * Get current sound config
 */
export function getSoundConfig(): SoundConfig {
  return { ...config };
}

/**
 * Update sound config
 */
export function updateSoundConfig(updates: Partial<SoundConfig>): void {
  config = { ...config, ...updates };

  // Update volume on all currently loaded sounds
  Object.values(sounds).forEach(sound => {
    sound.volume(config.volume);
  });
}

/**
 * Preload a sound effect
 */
export function preloadSound(effect: SoundEffect): void {
  if (!config.enabled) return;

  try {
    if (!sounds[effect]) {
      sounds[effect] = new Howl({
        src: [SOUND_FILES[effect]],
        volume: config.volume,
        preload: true,
      });
    }
  } catch (error) {
    console.warn(`[Sound] Failed to preload sound: ${effect}`, error);
  }
}

/**
 * Play a sound effect
 *
 * @param effect - The sound effect to play
 * @param options - Playback options
 */
export function playSound(
  effect: SoundEffect,
  options: {
    loop?: boolean;
    fadeIn?: boolean;
    fadeDuration?: number;
  } = {}
): void {
  if (!config.enabled) return;

  try {
    // Stop previous drum roll if playing a new one
    if (effect === 'drum-roll' && currentDrumRoll) {
      currentDrumRoll.stop();
    }

    // Get or create sound instance
    if (!sounds[effect]) {
      preloadSound(effect);
    }

    const sound = sounds[effect];
    if (!sound) return;

    // Handle loop for drum roll
    if (effect === 'drum-roll' && options.loop) {
      currentDrumRoll = sound;
    }

    // Play with optional fade in
    if (options.fadeIn && options.fadeDuration) {
      sound.play();
      sound.fade(0, config.volume, options.fadeDuration);
    } else {
      sound.play();
    }

    // Stop after animation for drum roll
    if (effect === 'drum-roll' && !options.loop) {
      const duration = sound.duration() * 1000;
      setTimeout(() => {
        sound.fade(config.volume, 0, 500);
        setTimeout(() => {
          sound.stop();
          if (currentDrumRoll === sound) {
            currentDrumRoll = null;
          }
        }, 500);
      }, duration - 500);
    }
  } catch (error) {
    console.warn(`[Sound] Failed to play sound: ${effect}`, error);
  }
}

/**
 * Stop the drum roll sound
 */
export function stopDrumRoll(): void {
  if (currentDrumRoll) {
    currentDrumRoll.fade(config.volume, 0, 300);
    setTimeout(() => {
      currentDrumRoll?.stop();
      currentDrumRoll = null;
    }, 300);
  }
}

/**
 * Play drum roll for animation
 */
export function playDrumRoll(durationSeconds: number = 5): void {
  playSound('drum-roll', { loop: true });

  // Auto-stop after duration
  setTimeout(() => {
    stopDrumRoll();
  }, durationSeconds * 1000);
}

/**
 * Play celebration sound
 */
export function playCelebration(): void {
  stopDrumRoll();
  playSound('celebration');
}

/**
 * Play tick sound for animation progress
 */
export function playTick(): void {
  playSound('tick');
}

/**
 * Play reveal sound when winner is shown
 */
export function playRevealSound(): void {
  playSound('reveal');
}

/**
 * Check if a sound file exists (returns true for now, actual check would need HTTP request)
 */
export function soundFileExists(effect: SoundEffect): boolean {
  // In production, you might want to check if the file actually exists
  // For now, return true to avoid unnecessary complexity
  return true;
}

/**
 * Generate simple beep sounds using Web Audio API
 * Fallback for when sound files are missing
 */
export function playBeep(frequency: number = 440, duration: number = 100): void {
  if (!config.enabled) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(config.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  } catch (error) {
    console.warn('[Sound] Failed to play beep:', error);
  }
}

/**
 * Play tick sound using Web Audio API (fallback)
 */
export function playTickBeep(): void {
  playBeep(800, 50); // Short high-pitched beep
}

/**
 * Play celebration sound using Web Audio API (fallback)
 */
export function playCelebrationBeep(): void {
  // Play a series of beeps for celebration
  const now = Date.now();
  playBeep(523, 100); // C5
  setTimeout(() => playBeep(659, 100), 150); // E5
  setTimeout(() => playBeep(784, 100), 300); // G5
  setTimeout(() => playBeep(1047, 300), 450); // C6
}

/**
 * Simple drum roll using Web Audio API (fallback)
 * Returns a cleanup function to stop the sound early
 */
export function playDrumRollBeep(duration: number = 3000): () => void {
  // Return a no-op cleanup if disabled
  if (!config.enabled) {
    return () => {};
  }

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.value = 200;

    const now = audioContext.currentTime;
    const tickDuration = 0.1; // 100ms per tick

    const endTime = now + duration / 1000;

    const interval = setInterval(() => {
      const currentTime = audioContext.currentTime;

      if (currentTime >= endTime) {
        clearInterval(interval);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        setTimeout(() => oscillator.stop(), 100);
        return;
      }

      // Quick attack/release for each tick
      gainNode.gain.setValueAtTime(config.volume * 0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + tickDuration / 2);

    }, tickDuration * 1000);

    oscillator.start(now);

    return () => {
      clearInterval(interval);
      oscillator.stop();
    };
  } catch (error) {
    console.warn('[Sound] Failed to play drum roll beep:', error);
  }

  return () => {};
}
