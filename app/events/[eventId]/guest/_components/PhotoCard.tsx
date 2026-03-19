import Image from 'next/image';
import { Heart, Download } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import type { IPhoto } from '@/lib/types';
import {
  photoCardVariants,
  heartBurstVariants,
  heartParticleVariants,
  createParticleBurst,
} from '@/lib/animations';

const PHOTO_CARD_STYLE_CLASSES: Record<string, string> = {
  vacation: 'rounded-2xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5',
  brutalist: 'rounded-none bg-white border-2 border-black shadow-[6px_6px_0_#000]',
  wedding: 'rounded-3xl bg-white border border-rose-200 shadow-[0_2px_4px_rgba(244,114,182,0.08),0_8px_24px_rgba(244,114,182,0.2)]',
  celebration: 'rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-pink-50 border border-amber-200 shadow-[0_2px_4px_rgba(249,115,22,0.06),0_10px_26px_rgba(249,115,22,0.18)]',
  futuristic: 'rounded-2xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.15),0_0_24px_rgba(34,211,238,0.25)]',
};

export interface PhotoCardProps {
  photo: IPhoto;
  index: number;
  userLoveCount: number;
  totalHeartCount: number;
  isAnimating: boolean;
  isSelected: boolean;
  canDownload: boolean;
  reactionsEnabled: boolean;
  photoCardStyle: string;
  onLoveReaction: (photoId: string) => void;
  onDownload: (photo: IPhoto) => void;
  onToggleSelect: (photoId: string) => void;
  onOpenLightbox: (photoId: string) => void;
}

export function PhotoCard({
  photo,
  index,
  userLoveCount,
  totalHeartCount,
  isAnimating,
  isSelected,
  canDownload,
  reactionsEnabled,
  photoCardStyle,
  onLoveReaction,
  onDownload,
  onToggleSelect,
  onOpenLightbox,
}: PhotoCardProps) {
  return (
    <motion.div
      custom={index}
      variants={photoCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={() => {
        if (photo.status === 'approved') onOpenLightbox(photo.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (photo.status !== 'approved' || !reactionsEnabled) return;
        onLoveReaction(photo.id);
      }}
      className={clsx(
        'group relative aspect-square overflow-hidden cursor-pointer',
        PHOTO_CARD_STYLE_CLASSES[photoCardStyle] || PHOTO_CARD_STYLE_CLASSES.vacation,
        canDownload && isSelected && 'ring-2 ring-violet-500'
      )}
    >
      <Image
        src={photo.images.medium_url || photo.images.full_url}
        alt={photo.caption || 'Event photo'}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        className="object-cover"
        priority={index < 4}
      />

      {/* Download button */}
      {canDownload && photo.status === 'approved' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(photo);
          }}
          className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-200 ease-out group-hover:opacity-100 hover:bg-black/60 hover:scale-110 active:scale-95"
          title="Download photo"
        >
          <Download className="h-4 w-4" />
        </button>
      )}

      {/* Select checkbox */}
      {canDownload && photo.status === 'approved' && (
        <label
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(photo.id)}
            className="h-4 w-4 rounded border-white text-violet-600 focus:ring-violet-500"
          />
        </label>
      )}

      {(photo.status === 'pending' || photo.status === 'rejected') && (
        <div className={clsx(
          'absolute inset-0 z-10 flex items-center justify-center text-center text-xs font-semibold uppercase tracking-wider',
          photo.status === 'pending'
            ? 'bg-black/55 text-yellow-100'
            : 'bg-black/70 text-red-100'
        )}>
          <span className="rounded-full bg-black/40 px-3 py-1">
            {photo.status === 'pending' ? 'Pending approval' : 'Rejected'}
          </span>
        </div>
      )}

      {/* Love Icon at Top Right (when user has loved) */}
      {reactionsEnabled && userLoveCount > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-pink-500 px-2 py-1 shadow-lg">
          <Heart className="h-4 w-4 fill-white text-white" />
          <span className="text-xs font-bold tabular-nums text-white">{userLoveCount}</span>
        </div>
      )}

      {/* Total Heart Count Badge */}
      {reactionsEnabled && totalHeartCount > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
          <Heart className={clsx(
            "h-3.5 w-3.5",
            userLoveCount > 0 ? "fill-pink-500 text-pink-500" : "fill-white text-white"
          )} />
          <span className="text-xs font-medium tabular-nums text-white">{totalHeartCount}</span>
        </div>
      )}

      {/* Overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          {photo.caption && (
            <p className="text-xs leading-relaxed line-clamp-2">{photo.caption}</p>
          )}
          {!photo.is_anonymous && photo.contributor_name && (
            <p className="mt-0.5 text-xs font-medium opacity-75 tracking-wide">- {photo.contributor_name}</p>
          )}
        </div>
      </div>

      {/* Heart Burst Animation (on double-click) */}
      {reactionsEnabled && isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <motion.div
            variants={heartBurstVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center"
          >
            <Heart className="h-20 w-20 fill-pink-500 text-pink-500 drop-shadow-lg" />
          </motion.div>
          {createParticleBurst(8).map((angle, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{ marginLeft: -12, marginTop: -12 }}
              {...heartParticleVariants(angle, 50)}
            >
              <Heart className="h-6 w-6 fill-pink-400 text-pink-400 drop-shadow-md" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Double-click hint overlay (only on hover, hidden during animation) */}
      {reactionsEnabled && !isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out bg-black/20">
          <Heart className="h-12 w-12 text-white opacity-80" />
          {userLoveCount >= 10 && (
            <span className="absolute bottom-12 text-xs text-white bg-black/50 px-2 py-1 rounded">Max reached</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
