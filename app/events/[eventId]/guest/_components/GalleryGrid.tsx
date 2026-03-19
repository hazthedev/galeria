import { ImageIcon, Loader2 } from 'lucide-react';
import type { IPhoto } from '@/lib/types';
import { PhotoCard } from './PhotoCard';
import type { RefObject } from 'react';

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
  surfaceText: string;
  surfaceMuted: string;
  surfaceBorder: string;
  themeSurface: string;
  inputBackground: string;
  onLoveReaction: (photoId: string) => void;
  onDownloadPhoto: (photo: IPhoto) => void;
  onToggleSelect: (photoId: string) => void;
  onOpenLightbox: (photoId: string) => void;
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
  surfaceText,
  surfaceMuted,
  surfaceBorder,
  themeSurface,
  inputBackground,
  onLoveReaction,
  onDownloadPhoto,
  onToggleSelect,
  onOpenLightbox,
  onLoadMore,
}: GalleryGridProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold leading-snug tracking-tight sm:text-xl" style={{ color: surfaceText }}>
        Event Photos
      </h2>
      {photos.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-16 text-center"
          style={{ backgroundColor: themeSurface, borderColor: surfaceBorder }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: inputBackground }}>
            <ImageIcon className="h-8 w-8" style={{ color: surfaceMuted }} />
          </div>
          <p className="text-lg font-semibold leading-snug tracking-tight" style={{ color: surfaceText }}>No photos yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed" style={{ color: surfaceMuted }}>
            Be the first to capture a moment — tap the camera button to upload a photo.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
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
                onOpenLightbox={onOpenLightbox}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center">
            {hasMoreApproved && (
              isLoadingMore ? (
                <div
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: surfaceMuted }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more photos...
                </div>
              ) : (
                <button
                  onClick={onLoadMore}
                  className="rounded-full border px-5 py-2.5 text-sm font-medium transition-shadow duration-150 ease-out hover:shadow-md"
                  style={{ borderColor: surfaceBorder, color: surfaceText, backgroundColor: inputBackground }}
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
