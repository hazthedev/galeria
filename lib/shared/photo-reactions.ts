import type { IPhotoReactions } from '@/lib/types';

export const EMPTY_PHOTO_REACTIONS: IPhotoReactions = {
  heart: 0,
  clap: 0,
  laugh: 0,
  wow: 0,
};

function toReactionCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function normalizePhotoReactions(
  reactions?: Partial<IPhotoReactions> | null
): IPhotoReactions {
  return {
    heart: toReactionCount(reactions?.heart),
    clap: toReactionCount(reactions?.clap),
    laugh: toReactionCount(reactions?.laugh),
    wow: toReactionCount(reactions?.wow),
  };
}
