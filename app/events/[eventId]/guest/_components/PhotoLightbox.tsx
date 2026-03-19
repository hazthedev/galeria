'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { Heart, Download, X } from 'lucide-react';
import type { IPhoto } from '@/lib/types';

export interface PhotoLightboxProps {
  open: boolean;
  index: number;
  photos: IPhoto[];
  userLoves: Record<string, number>;
  reactionsEnabled: boolean;
  canDownload: boolean;
  themeSecondary: string;
  secondaryText: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onLoveReaction: (photoId: string) => void;
  onDownload: (photo: IPhoto) => void;
}

export function PhotoLightbox({
  open,
  index,
  photos,
  userLoves,
  reactionsEnabled,
  canDownload,
  themeSecondary,
  secondaryText,
  onClose,
  onIndexChange,
  onLoveReaction,
  onDownload,
}: PhotoLightboxProps) {
  const approvedPhotos = photos.filter((p) => p.status === 'approved');
  const currentPhoto = approvedPhotos[index];

  const slides = approvedPhotos.map((photo) => ({
    src: photo.images.full_url,
    alt: photo.caption || 'Event photo',
    width: photo.images.width || 1920,
    height: photo.images.height || 1080,
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      on={{ view: ({ index: i }) => onIndexChange(i) }}
      slides={slides}
      plugins={[Zoom, Counter]}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
      carousel={{ finite: false }}
      animation={{ fade: 250 }}
      controller={{ closeOnBackdropClick: true }}
      toolbar={{
        buttons: [
          <LightboxToolbar
            key="toolbar"
            photo={currentPhoto}
            userLoves={userLoves}
            reactionsEnabled={reactionsEnabled}
            canDownload={canDownload}
            themeSecondary={themeSecondary}
            secondaryText={secondaryText}
            onLoveReaction={onLoveReaction}
            onDownload={onDownload}
          />,
          'close',
        ],
      }}
      render={{
        iconClose: () => <X className="h-6 w-6" />,
        slideFooter: () =>
          currentPhoto ? (
            <LightboxCaption photo={currentPhoto} />
          ) : null,
      }}
    />
  );
}

function LightboxToolbar({
  photo,
  userLoves,
  reactionsEnabled,
  canDownload,
  themeSecondary,
  secondaryText,
  onLoveReaction,
  onDownload,
}: {
  photo: IPhoto | undefined;
  userLoves: Record<string, number>;
  reactionsEnabled: boolean;
  canDownload: boolean;
  themeSecondary: string;
  secondaryText: string;
  onLoveReaction: (photoId: string) => void;
  onDownload: (photo: IPhoto) => void;
}) {
  if (!photo) return null;

  const userCount = userLoves[photo.id] || 0;
  const totalCount = photo.reactions?.heart || 0;
  const isMaxed = userCount >= 10;

  return (
    <div className="flex items-center gap-2">
      {reactionsEnabled && (
        <button
          onClick={() => onLoveReaction(photo.id)}
          disabled={isMaxed}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          style={
            userCount > 0
              ? { backgroundColor: '#ec4899', color: '#fff' }
              : { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }
          }
          title={isMaxed ? 'Max loves reached' : 'Love this photo'}
        >
          <Heart
            className="h-4 w-4"
            style={userCount > 0 ? { fill: '#fff' } : undefined}
          />
          {totalCount > 0 && <span>{totalCount}</span>}
        </button>
      )}
      {canDownload && (
        <button
          onClick={() => onDownload(photo)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          style={{ backgroundColor: themeSecondary, color: secondaryText }}
          title="Download photo"
        >
          <Download className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function LightboxCaption({ photo }: { photo: IPhoto }) {
  if (!photo.caption && (photo.is_anonymous || !photo.contributor_name)) {
    return null;
  }

  return (
    <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
      <div className="inline-block rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
        {photo.caption && (
          <p className="text-sm text-white">{photo.caption}</p>
        )}
        {!photo.is_anonymous && photo.contributor_name && (
          <p className="text-xs text-white/70 mt-0.5">
            by {photo.contributor_name}
          </p>
        )}
      </div>
    </div>
  );
}
