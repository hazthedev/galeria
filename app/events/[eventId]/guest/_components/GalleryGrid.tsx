import { Camera, ImageIcon, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { IPhoto } from '@/lib/types';
import { PhotoCard } from './PhotoCard';
import type { RefObject } from 'react';

// Theme colors read from CSS variables (--g-*) set by GuestEventPageView
const v = {
  text: 'var(--g-text)',
  muted: 'var(--g-muted)',
  border: 'var(--g-border)',
  surface: 'var(--g-surface)',
  inputBg: 'var(--g-input-bg)',
} as const;

export interface GalleryGridProps {
  photos: IPhoto[];
  userLoves: Record<string, number>;
  animatingPhotos: Set<string>;
  selectedPhotoIds: Set<string>;
  canDownload: boolean;
  reactionsEnabled: boolean;
  photoCardStyle: string;
  hasMoreApproved: boolean;
  isLoadingMore: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onLoveReaction: (photoId: string) => void;
  onDownloadPhoto: (photo: IPhoto) => void;
  onToggleSelect: (photoId: string) => void;
  onOpenLightbox: (photoId: string) => void;
  lightboxEnabled: boolean;
  onLoadMore: () => void;
}

export function GalleryGrid({
  photos,
  userLoves,
  animatingPhotos,
  selectedPhotoIds,
  canDownload,
  reactionsEnabled,
  photoCardStyle,
  hasMoreApproved,
  isLoadingMore,
  loadMoreRef,
  onLoveReaction,
  onDownloadPhoto,
  onToggleSelect,
  onOpenLightbox,
  lightboxEnabled,
  onLoadMore,
}: GalleryGridProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl" style={{ color: v.text }}>
          Event Photos
        </h2>
        {photos.length > 0 && (
          <span className="text-xs font-medium tabular-nums" style={{ color: v.muted }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {photos.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-2xl px-8 py-16 text-center sm:py-20"
          style={{ backgroundColor: v.inputBg }}
        >
          <div className="relative mb-6">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl border shadow-sm"
              style={{ backgroundColor: v.surface, borderColor: v.border }}
            >
              <Camera className="h-9 w-9" style={{ color: v.muted }} />
            </div>
            <div
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
              style={{ backgroundColor: v.surface }}
            >
              <ImageIcon className="h-4 w-4" style={{ color: v.muted }} />
            </div>
          </div>
          <p className="text-lg font-semibold leading-snug tracking-tight" style={{ color: v.text }}>
            No photos yet
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed" style={{ color: v.muted }}>
            Be the first to share a moment — tap the camera button below to get started.
          </p>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <AnimatePresence mode="popLayout">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <PhotoCard
                    photo={photo}
                    index={index}
                    userLoveCount={userLoves[photo.id] || 0}
                    totalHeartCount={photo.reactions?.heart || 0}
                    isAnimating={animatingPhotos.has(photo.id)}
                    isSelected={selectedPhotoIds.has(photo.id)}
                    canDownload={canDownload}
                    reactionsEnabled={reactionsEnabled}
                    photoCardStyle={photoCardStyle}
                    onLoveReaction={onLoveReaction}
                    onDownload={onDownloadPhoto}
                    onToggleSelect={onToggleSelect}
                    onOpenLightbox={lightboxEnabled ? onOpenLightbox : () => {}}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          <div className="mt-6 flex items-center justify-center">
            {hasMoreApproved && (
              isLoadingMore ? (
                <div
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: v.muted }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more photos...
                </div>
              ) : (
                <button
                  onClick={onLoadMore}
                  className="rounded-full border px-5 py-2.5 text-sm font-medium transition-shadow duration-150 ease-out hover:shadow-md"
                  style={{ borderColor: v.border, color: v.text, backgroundColor: v.inputBg }}
                >
                  Load more photos
                </button>
              )
            )}
          </div>
          <div ref={loadMoreRef} className="h-1" />
        </>
      )}
    </div>
  );
}
