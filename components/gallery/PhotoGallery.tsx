// ============================================
// MOMENTIQUE - Real-Time Photo Gallery Component
// ============================================
// Displays photos with live updates via WebSocket

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import type { IPhoto } from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface PhotoGalleryProps {
  isModerator?: boolean;
  photos?: IPhoto[];
  onReaction?: (photoId: string, emoji: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function PhotoGallery({
  isModerator = false,
  photos: initialPhotos = [],
  onReaction,
}: PhotoGalleryProps) {
  // State
  const [photos, setPhotos] = useState<IPhoto[]>(initialPhotos);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ============================================
  // REACTION HANDLERS
  // ============================================

  const handleReaction = useCallback(
    async (photoId: string, emoji: 'heart' | 'clap' | 'laugh' | 'wow') => {
      try {
        // Optimistic update
        setPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  reactions: {
                    ...photo.reactions,
                    [emoji]: (photo.reactions[emoji] || 0) + 1,
                  },
                }
              : photo
          )
        );

        // Call callback
        onReaction?.(photoId, emoji);

        // API call
        const response = await fetch(`/api/photos/${photoId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });

        if (!response.ok) {
          // Revert on failure
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === photoId
                ? {
                    ...photo,
                    reactions: {
                      ...photo.reactions,
                      [emoji]: Math.max(0, (photo.reactions[emoji] || 0) - 1),
                    },
                  }
                : photo
            )
          );
        }
      } catch (error) {
        console.error('[Gallery] Error adding reaction:', error);
      }
    },
    [onReaction]
  );

  // ============================================
  // MODERATION ACTIONS (if moderator)
  // ============================================

  const handleApprove = useCallback(
    async (photoId: string) => {
      if (!isModerator) return;

      try {
        const response = await fetch(`/api/photos/${photoId}/approve`, {
          method: 'PATCH',
        });

        if (response.ok) {
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === photoId ? { ...photo, status: 'approved' as IPhoto['status'] } : photo
            )
          );
        }
      } catch (error) {
        console.error('[Gallery] Error approving photo:', error);
      }
    },
    [isModerator]
  );

  const handleReject = useCallback(
    async (photoId: string) => {
      if (!isModerator) return;

      try {
        const response = await fetch(`/api/photos/${photoId}/reject`, {
          method: 'PATCH',
        });

        if (response.ok) {
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === photoId ? { ...photo, status: 'rejected' as IPhoto['status'] } : photo
            )
          );
        }
      } catch (error) {
        console.error('[Gallery] Error rejecting photo:', error);
      }
    },
    [isModerator]
  );

  // ============================================
  // LIGHTBOX HANDLERS
  // ============================================

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full">
      {/* Gallery Grid */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {photos.map((photo, index) => {
          const photoReactions = photo.reactions;

          return (
            <div
              key={photo.id}
              className="group relative mb-4 overflow-hidden rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow duration-200"
              onClick={() => openLightbox(index)}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={photo.images.medium_url || photo.images.full_url}
                  alt={photo.caption || 'Event photo'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1920px) 50vw, (max-width: 3840px) 33vw"
                  className="object-cover w-full h-full cursor-pointer"
                  loading="lazy"
                />
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(photo.id, 'heart');
                      }}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      ❤️ {photoReactions.heart || 0}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(photo.id, 'clap');
                      }}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      👏 {photoReactions.clap || 0}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(photo.id, 'laugh');
                      }}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      😂 {photoReactions.laugh || 0}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(photo.id, 'wow');
                      }}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      😮 {photoReactions.wow || 0}
                    </button>
                  </div>

                  {photo.caption && (
                    <p className="text-sm line-clamp-2">{photo.caption}</p>
                  )}

                  {!photo.is_anonymous && photo.contributor_name && (
                    <p className="text-xs opacity-75">- {photo.contributor_name}</p>
                  )}

                  {isModerator && photo.status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(photo.id);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(photo.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status badge */}
              {photo.status === 'pending' && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                  Pending
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No photos message */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.294a9.956 9.956 0 111.414 1.414M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2-2v2a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No photos yet</p>
          <p className="text-sm text-gray-400">Be the first to share a moment!</p>
        </div>
      )}

      {/* Lightbox */}
      {photos.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={closeLightbox}
          index={lightboxIndex}
          slides={photos.map((photo) => ({
            src: photo.images.full_url,
            alt: photo.caption || 'Event photo',
            caption: photo.caption,
          }))}
        />
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default PhotoGallery;
