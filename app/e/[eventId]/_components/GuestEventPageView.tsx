import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Upload,
  Loader2,
  ImageIcon,
  X,
  Trophy,
  Camera,
  Check,
  Heart,
  Download,
  UserCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoChallengeProgressBar } from '@/components/photo-challenge/progress-bar';
import { PhotoChallengePrizeModal } from '@/components/photo-challenge/prize-modal';
import { Recaptcha } from '@/components/auth/Recaptcha';
import { SlotMachineAnimation } from '@/components/lucky-draw/SlotMachineAnimation';
import { CheckInModal } from '@/components/attendance/CheckInModal';
import type { IPhoto } from '@/lib/types';
import { formatDrawNumber } from '../_lib/guest-utils';
import {
  photoCardVariants,
  modalBackdropVariants,
  modalContentVariants,
  luckyNumberVariants,
  heartBurstVariants,
  heartParticleVariants,
  floatingButtonVariants,
  fileCardVariants,
  createParticleBurst,
} from '@/lib/animations';
import { GuestNameModal } from './GuestNameModal';
import { GuestShareModal } from './GuestShareModal';
import { useGuestEventPageController } from '../_hooks/useGuestEventPageController';

const PHOTO_CARD_STYLE_CLASSES: Record<string, string> = {
  vacation: 'rounded-2xl bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5',
  brutalist: 'rounded-none bg-white border-2 border-black shadow-[6px_6px_0_#000]',
  wedding: 'rounded-3xl bg-white border border-rose-200 shadow-[0_8px_24px_rgba(244,114,182,0.25)]',
  celebration: 'rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-pink-50 border border-amber-200 shadow-[0_10px_26px_rgba(249,115,22,0.25)]',
  futuristic: 'rounded-2xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.35)]',
};

type GuestEventPageViewProps = {
  controller: ReturnType<typeof useGuestEventPageController>;
};

export function GuestEventPageView({ controller }: GuestEventPageViewProps) {
  const {
    resolvedEventId, event, isLoading, isResolving, error, showShareModal, showUploadModal, showCheckInModal,
    hasCheckedIn, isUploading, isOptimizing, uploadError, uploadSuccess, uploadSuccessMessage, optimizedCount,
    moderationNotice, moderationNoticeType, joinLuckyDraw, hasJoinedDraw, luckyDrawNumbers, hasActiveLuckyDrawConfig,
    photoChallenge, challengeProgress, showPrizeModal, fingerprint, recaptchaToken, recaptchaError, winner,
    showDrawOverlay, showWinnerOverlay, mergedPhotos, guestName, isAnonymous, showGuestModal, allowAnonymous,
    luckyDrawEnabled, attendanceEnabled, photoCardStyle, themePrimary, themeSecondary, themeBackground, themeSurface,
    themeGradient, surfaceText, surfaceMuted, surfaceBorder, inputBackground, inputBorder, headerBackground,
    secondaryText, selectedFiles, caption, userLoves, animatingPhotos, selectedPhotoIds, canDownload, selectedCount,
    loadMoreRef, hasMoreApproved, isLoadingMore, handleGuestModalSubmit, setShowGuestModal, handleLoveReaction,
    handleDownloadPhoto, handleDownloadAll, handleDownloadSelected, handleDownloadSelectedIndividually,
    toggleSelectedPhoto, loadMoreApproved, setShowShareModal, shareUrl, handleShare, copyToClipboard, handleFileSelect,
    removeSelectedFile, handleUpload, setShowUploadModal, setRecaptchaToken, setRecaptchaError, setCaption,
    setJoinLuckyDraw, setSelectedFiles, setUploadError, setUploadSuccess, setUploadSuccessMessage, setOptimizedCount,
    setShowCheckInModal, setHasCheckedIn, setIsAnonymous, setShowPrizeModal, setShowDrawOverlay, setShowWinnerOverlay,
  } = controller;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        {isResolving && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Resolving event link...</p>
        )}
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {error || 'Event not found'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The event may have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen" style={{ background: themeBackground }}>
      {/* Guest Name Modal */}
      <GuestNameModal
        isOpen={showGuestModal}
        onSubmit={handleGuestModalSubmit}
        eventName={event.name}
        initialName={guestName}
        initialAnonymous={isAnonymous}
        themeGradient={themeGradient}
        themeSurface={themeSurface}
        themeSecondary={themeSecondary}
        secondaryText={secondaryText}
        surfaceText={surfaceText}
        surfaceMuted={surfaceMuted}
        surfaceBorder={surfaceBorder}
        inputBackground={inputBackground}
        inputBorder={inputBorder}
        allowAnonymous={allowAnonymous}
      />

      {/* Lucky Draw Overlays */}
      {showDrawOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl"
            style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: surfaceText }}>
                Lucky Draw
              </h3>
              <button
                onClick={() => setShowDrawOverlay(false)}
                className="hover:opacity-80"
                style={{ color: surfaceMuted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-sm font-medium" style={{ color: surfaceText }}>
                The lucky draw is starting...
              </p>
              <p className="text-xs" style={{ color: surfaceMuted }}>
                Stay tuned for the winner announcement.
              </p>
            </div>
          </div>
        </div>
      )}

      {showWinnerOverlay && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl p-6 text-center shadow-2xl"
            style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: surfaceText }}>
                Winner Announced
              </h3>
              <button
                onClick={() => setShowWinnerOverlay(false)}
                className="hover:opacity-80"
                style={{ color: surfaceMuted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SlotMachineAnimation
              durationSeconds={5}
              numberString={formatDrawNumber(winner.entry_id)}
              participantName={winner.participant_name || 'Anonymous'}
              photoUrl={winner.selfie_url}
              prizeName={`Prize Tier ${winner.prize_tier}`}
              showSelfie
              showFullName
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{ backgroundColor: headerBackground, borderColor: surfaceBorder }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold" style={{ color: surfaceText }}>
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {event.custom_hashtag && (
                  <span style={{ color: surfaceMuted }}>
                    #{event.custom_hashtag}
                  </span>
                )}
                {(guestName || isAnonymous) && (
                  <span style={{ color: surfaceMuted }}>
                    Hi, {isAnonymous ? 'Anonymous' : guestName}!
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
              {luckyDrawEnabled && (
                <a
                  href="#lucky-draw"
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: themeSecondary,
                    color: secondaryText,
                    borderColor: surfaceBorder,
                  }}
                >
                  <Trophy className="h-4 w-4" />
                  Lucky Draw
                </a>
              )}
              {canDownload && (
                <>
                  {selectedCount > 0 && (
                    <>
                      <button
                        onClick={handleDownloadSelectedIndividually}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                        style={{
                          backgroundColor: themeSecondary,
                          color: secondaryText,
                          borderColor: surfaceBorder,
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download selected ({selectedCount})
                      </button>
                      <button
                        onClick={handleDownloadSelected}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                        style={{ color: surfaceText, borderColor: surfaceBorder }}
                      >
                        <Download className="h-4 w-4" />
                        Download ZIP ({selectedCount})
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDownloadAll}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                    style={{ color: surfaceText, borderColor: surfaceBorder }}
                  >
                    <Download className="h-4 w-4" />
                    Download all
                  </button>
                </>
              )}
              <button
                onClick={() => setShowGuestModal(true)}
                className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium"
                style={{ color: surfaceText, borderColor: themeSecondary }}
              >
                {isAnonymous || !guestName ? 'Add name' : 'Edit name'}
              </button>
              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white sm:w-auto"
                style={{ backgroundColor: themeSecondary, color: secondaryText }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {luckyDrawEnabled && (
          <section
            id="lucky-draw"
            className="mb-8 rounded-2xl border p-6 shadow-sm sm:p-8 scroll-mt-24"
            style={{ backgroundColor: themeSurface, borderColor: themePrimary, color: surfaceText }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2" style={{ color: themeSecondary }}>
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Lucky Draw</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold" style={{ color: surfaceText }}>
                  Your Entry Numbers
                </h2>
                <p className="mt-2 text-sm" style={{ color: surfaceMuted }}>
                  Join the lucky draw when you upload a photo to get your entry number.
                </p>
              </div>
              <div
                className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: themeSecondary, color: secondaryText }}
              >
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6">
              {luckyDrawNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {luckyDrawNumbers.map((number, index) => (
                    <motion.span
                      key={`${number}-${index}`}
                      custom={index}
                      variants={luckyNumberVariants}
                      initial="hidden"
                      animate="visible"
                      className="rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1"
                      style={{
                        backgroundColor: themeSecondary,
                        color: secondaryText,
                        borderColor: surfaceBorder,
                      }}
                    >
                      #{number}
                    </motion.span>
                  ))}
                </div>
              ) : hasJoinedDraw ? (
                <div
                  className="rounded-lg border p-4 text-sm"
                  style={{ backgroundColor: themeSurface, borderColor: surfaceBorder, color: surfaceMuted }}
                >
                  You are in the draw. Your lucky draw number will appear shortly.
                </div>
              ) : (
                <div
                  className="rounded-lg border p-4 text-sm"
                  style={{ backgroundColor: themeSurface, borderColor: surfaceBorder, color: surfaceMuted }}
                >
                  Join the lucky draw when you upload your photo to get your entry number.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Event Details Card */}
        <div
          className="mb-8 rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{ backgroundColor: themeSurface, borderColor: themePrimary, color: surfaceText }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: themeSecondary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: surfaceMuted }}>Date</p>
                <p className="text-sm font-semibold" style={{ color: surfaceText }}>{formattedDate}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: themeSecondary }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: surfaceMuted }}>Location</p>
                  <p className="text-sm font-semibold" style={{ color: surfaceText }}>{event.location}</p>
                </div>
              </div>
            )}

            {event.expected_guests && (
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: themeSecondary }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: surfaceMuted }}>Guests</p>
                  <p className="text-sm font-semibold" style={{ color: surfaceText }}>{event.expected_guests}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <ImageIcon className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: themeSecondary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: surfaceMuted }}>Photos</p>
                <p className="text-sm font-semibold" style={{ color: surfaceText }}>{mergedPhotos.length}</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: themePrimary }}>
              <p className="text-sm" style={{ color: surfaceMuted }}>{event.description}</p>
            </div>
          )}
        </div>

        {/* Upload CTA */}
        {moderationNotice && (
          <div
            className={clsx(
              'mb-6 rounded-lg px-4 py-3 text-sm font-medium',
              moderationNoticeType === 'approved'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            )}
          >
            {moderationNotice}
          </div>
        )}
        <div className="mb-8">
          <button
            onClick={() => {
              setShowUploadModal(true);
              setRecaptchaToken(null);
              setRecaptchaError(null);
            }}
            className="w-full rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
            style={{ backgroundColor: themeSurface, borderColor: themePrimary, color: surfaceText }}
          >
            <Upload className="mx-auto mb-3 h-10 w-10" style={{ color: themeSecondary }} />
            <h3 className="text-lg font-semibold" style={{ color: surfaceText }}>
              Share Your Photos
            </h3>
            <p className="mt-1 text-sm" style={{ color: surfaceMuted }}>
              Upload your favorite moments from this event
            </p>
          </button>
        </div>

        {/* Photo Gallery */}
        <div>
          <h2 className="mb-4 text-xl font-semibold" style={{ color: surfaceText }}>
            Event Photos
          </h2>
          {mergedPhotos.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-12 text-center"
              style={{ backgroundColor: themeSurface, borderColor: surfaceBorder }}
            >
              <ImageIcon className="mx-auto mb-4 h-16 w-16" style={{ color: surfaceMuted }} />
              <p style={{ color: surfaceText }}>No photos yet</p>
              <p className="mt-1 text-sm" style={{ color: surfaceMuted }}>
                Be the first to share a moment!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {mergedPhotos.map((photo, index) => {
                  const userLoveCount = userLoves[photo.id] || 0;
                  const totalHeartCount = photo.reactions?.heart || 0;

                  return (
                    <motion.div
                      key={photo.id}
                      custom={index}
                      variants={photoCardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      onDoubleClick={() => {
                        if (photo.status !== 'approved') return;
                        handleLoveReaction(photo.id);
                      }}
                      className={clsx(
                        'group relative aspect-square overflow-hidden cursor-pointer',
                        PHOTO_CARD_STYLE_CLASSES[photoCardStyle] || PHOTO_CARD_STYLE_CLASSES.vacation,
                        canDownload && selectedPhotoIds.has(photo.id) && 'ring-2 ring-violet-500'
                      )}
                    >
                      <Image
                        src={photo.images.medium_url || photo.images.full_url}
                        alt={photo.caption || 'Event photo'}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className="object-cover"
                      />

                      {/* Download button */}
                      {canDownload && photo.status === 'approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPhoto(photo);
                          }}
                          className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
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
                            checked={selectedPhotoIds.has(photo.id)}
                            onChange={() => toggleSelectedPhoto(photo.id)}
                            className="h-4 w-4 rounded border-white text-violet-600 focus:ring-violet-500"
                          />
                        </label>
                      )}

                      {(photo.status === 'pending' || photo.status === 'rejected') && (
                        <div className={clsx(
                          'absolute inset-0 z-10 flex items-center justify-center text-center text-xs font-semibold uppercase tracking-wide',
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
                      {userLoveCount > 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-pink-500 px-2 py-1 shadow-lg">
                          <Heart className="h-4 w-4 fill-white text-white" />
                          <span className="text-xs font-bold text-white">{userLoveCount}</span>
                        </div>
                      )}

                      {/* Total Heart Count Badge */}
                      {totalHeartCount > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
                          <Heart className={clsx(
                            "h-3.5 w-3.5",
                            userLoveCount > 0 ? "fill-pink-500 text-pink-500" : "fill-white text-white"
                          )} />
                          <span className="text-xs font-medium text-white">{totalHeartCount}</span>
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          {photo.caption && (
                            <p className="text-xs line-clamp-2">{photo.caption}</p>
                          )}
                          {!photo.is_anonymous && photo.contributor_name && (
                            <p className="text-xs opacity-75">- {photo.contributor_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Heart Burst Animation (on double-click) */}
                      {animatingPhotos.has(photo.id) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          {/* Central heart */}
                          <motion.div
                            variants={heartBurstVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex items-center justify-center"
                          >
                            <Heart className="h-20 w-20 fill-pink-500 text-pink-500 drop-shadow-lg" />
                          </motion.div>
                          {/* Particle hearts */}
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
                      {!animatingPhotos.has(photo.id) && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <Heart className="h-12 w-12 text-white opacity-80" />
                          {userLoveCount >= 10 && (
                            <span className="absolute bottom-12 text-xs text-white bg-black/50 px-2 py-1 rounded">Max reached</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-center">
                {hasMoreApproved && (
                  isLoadingMore ? (
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'rgb(71, 85, 105)' }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more photos...
                    </div>
                  ) : (
                    <button
                      onClick={loadMoreApproved}
                      className="rounded-full border px-4 py-2 text-sm font-medium hover:opacity-80"
                      style={{ borderColor: surfaceBorder, color: surfaceText, backgroundColor: inputBackground }}
                    >
                      Load 5 more
                    </button>
                  )
                )}
              </div>
              <div ref={loadMoreRef} className="h-1" />
            </>
          )}
        </div>
      </div>

      <GuestShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyLink={copyToClipboard}
        shareUrl={shareUrl}
        themeSurface={themeSurface}
        surfaceText={surfaceText}
        surfaceMuted={surfaceMuted}
        surfaceBorder={surfaceBorder}
        inputBackground={inputBackground}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                variants={modalContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder }}
              >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: surfaceText }}>
                Upload Photo
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setUploadError(null);
                  setUploadSuccess(false);
                  setUploadSuccessMessage('Photo uploaded successfully!');
                  setCaption('');
                  setOptimizedCount(0);
                  setRecaptchaToken(null);
                  setRecaptchaError(null);
                }}
                className="hover:opacity-80"
                style={{ color: surfaceMuted }}
                disabled={isUploading || isOptimizing}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium" style={{ color: surfaceText }}>
                  {uploadSuccessMessage}
                  {optimizedCount > 0 && (
                    <span className="ml-2 text-xs" style={{ color: surfaceMuted }}>
                      Optimized {optimizedCount} photo{optimizedCount > 1 ? 's' : ''} for upload.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {uploadError}
              </div>
            )}

            {/* Uploading State */}
            {isUploading && (
              <div
                className="mb-4 flex flex-col items-center gap-3 rounded-lg p-6"
                style={{ backgroundColor: inputBackground }}
              >
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: themeSecondary }} />
                <p className="text-sm font-medium text-gray-900">
                  Uploading photos...
                </p>
              </div>
            )}

            {isOptimizing && (
              <div
                className="mb-4 flex flex-col items-center gap-3 rounded-lg p-6"
                style={{ backgroundColor: inputBackground }}
              >
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: themeSecondary }} />
                <p className="text-sm font-medium text-gray-900">
                  Optimizing large photos...
                </p>
              </div>
            )}

            {!uploadSuccess && !isUploading && !isOptimizing && (
              <div className="space-y-4">
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium" style={{ color: surfaceText }}>
                      Selected Photos ({selectedFiles.length}/5)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <AnimatePresence>
                        {selectedFiles.map((file, index) => (
                          <motion.div
                            key={`${file.name}-${file.preview}`}
                            variants={fileCardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            custom={index}
                            className="relative aspect-square rounded-lg overflow-hidden"
                            style={{ backgroundColor: inputBackground }}
                        >
                          <Image
                            src={file.preview}
                            alt={file.name}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* File Selection Buttons */}
                {selectedFiles.length < 5 && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Camera Button */}
                    <label
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all hover:opacity-90"
                      style={{ borderColor: themePrimary, backgroundColor: inputBackground }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <Camera className="h-8 w-8" style={{ color: themeSecondary }} />
                      <span className="text-xs font-semibold" style={{ color: surfaceText }}>
                        Camera
                      </span>
                    </label>

                    {/* Gallery Button */}
                    <label
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all hover:opacity-90"
                      style={{ borderColor: themePrimary, backgroundColor: inputBackground }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <ImageIcon className="h-8 w-8" style={{ color: themeSecondary }} />
                      <span className="text-xs font-semibold" style={{ color: surfaceText }}>
                        Gallery
                      </span>
                    </label>
                  </div>
                )}

                <p className="text-xs text-center" style={{ color: surfaceMuted }}>
                  Large photos are optimized automatically before upload
                </p>

                {/* Caption */}
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: surfaceText }}>
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                    style={{ backgroundColor: inputBackground, borderColor: inputBorder, color: surfaceText }}
                    maxLength={200}
                  />
                </div>

                {/* Lucky Draw Entry */}
                {luckyDrawEnabled && !isAnonymous && (
                  <div
                    className="rounded-lg border p-4"
                    style={{ borderColor: surfaceBorder, backgroundColor: inputBackground }}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={joinLuckyDraw}
                        onChange={(e) => setJoinLuckyDraw(e.target.checked)}
                        disabled={hasJoinedDraw || hasActiveLuckyDrawConfig === false}
                        className="mt-0.5 h-4 w-4 rounded text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderColor: inputBorder }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <span className="text-sm font-medium" style={{ color: surfaceText }}>
                            Join Lucky Draw
                          </span>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: surfaceMuted }}>
                          Enter this photo into the lucky draw for a chance to win prizes!
                        </p>
                        {hasActiveLuckyDrawConfig === false && (
                          <p className="mt-1 text-xs" style={{ color: '#F59E0B' }}>
                            Lucky draw is not configured yet.
                          </p>
                        )}
                        {hasJoinedDraw && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            ✓ You have already joined the lucky draw
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                {/* Photo Challenge Progress Bar */}
                {photoChallenge?.enabled && (
                  <PhotoChallengeProgressBar
                    challenge={photoChallenge}
                    progress={challengeProgress}
                    themePrimary={themePrimary}
                    themeSecondary={themeSecondary}
                    surfaceText={surfaceText}
                    surfaceMuted={surfaceMuted}
                    surfaceBorder={surfaceBorder}
                    inputBackground={inputBackground}
                  />
                )}

                {allowAnonymous && isAnonymous && (
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      ⚠️ Anonymous users cannot participate in the lucky draw
                    </p>
                  </div>
                )}

                {(isAnonymous || !guestName.trim()) && (
                  <div
                    className="rounded-lg border p-3"
                    style={{ borderColor: surfaceBorder, backgroundColor: inputBackground }}
                  >
                    <Recaptcha
                      onVerified={(token) => {
                        setRecaptchaToken(token);
                        setRecaptchaError(null);
                      }}
                      onExpired={() => {
                        setRecaptchaToken(null);
                      }}
                      onError={(err) => setRecaptchaError(err)}
                    />
                    {recaptchaToken && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                        CAPTCHA verified
                      </p>
                    )}
                    {!recaptchaToken && recaptchaError && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {recaptchaError}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || isOptimizing}
                    className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ backgroundColor: themeSecondary, color: secondaryText }}
                  >
                    Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                  </button>
                )}

                {/* Photos Remaining Info */}
                {(() => {
                  const userLimit = event?.settings?.limits?.max_photos_per_user;
                  const userPhotos = mergedPhotos.filter(photo => photo.user_fingerprint === `guest_${fingerprint}`).length;
                  const remaining = userLimit === null || userLimit === undefined
                    ? `${userPhotos} uploaded`
                    : Math.max(0, userLimit - userPhotos);

                  return (
                    <p className="text-xs text-center" style={{ color: surfaceMuted }}>
                      {typeof remaining === 'string'
                        ? `${remaining}`
                        : `${remaining} photo${userPhotos === 1 && typeof remaining !== 'string' && remaining > 1 ? '' : 's'} remaining`}
                    </p>
                  );
                })()}
              </div>
            )}
            </motion.div>
          </motion.div>
        </>
        )}
      </AnimatePresence>

      {/* Floating Camera Button */}
      {event?.settings?.features?.photo_upload_enabled !== false && (
        <motion.button
          onClick={() => {
            setShowUploadModal(true);
            setRecaptchaToken(null);
            setRecaptchaError(null);
          }}
          animate="idle"
          whileHover="hover"
          whileTap="tap"
          variants={floatingButtonVariants}
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl"
          style={{ backgroundImage: `linear-gradient(135deg, ${themePrimary}, ${themeSecondary})` }}
          aria-label="Quick photo upload"
        >
          <Camera className="h-8 w-8" />
        </motion.button>
      )}

      {/* Check-in Button */}
      {attendanceEnabled && !hasCheckedIn && (
        <motion.button
          onClick={() => setShowCheckInModal(true)}
          animate="idle"
          whileHover="hover"
          whileTap="tap"
          variants={floatingButtonVariants}
          className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 md:bottom-6 md:left-6"
          aria-label="Check in"
        >
          <UserCheck className="h-5 w-5" />
          <span>Check In</span>
        </motion.button>
      )}

      {/* Checked-in Badge */}
      {attendanceEnabled && hasCheckedIn && (
        <div className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg md:bottom-6 md:left-6 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Check className="h-5 w-5" />
          <span>Checked In</span>
        </div>
      )}

      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <CheckInModal
            eventId={resolvedEventId || ''}
            onClose={() => setShowCheckInModal(false)}
            onSuccess={() => {
              setHasCheckedIn(true);
              setShowCheckInModal(false);
              // Mark user as non-anonymous after check-in so progress bar shows
              setIsAnonymous(false);
              // Store the check-in status in localStorage for persistence
              if (typeof window !== 'undefined') {
                localStorage.setItem(`event_${resolvedEventId}_checked_in`, 'true');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Photo Challenge Prize Modal */}
      <AnimatePresence>
        {showPrizeModal && photoChallenge && challengeProgress && resolvedEventId && (
          <PhotoChallengePrizeModal
            isOpen={showPrizeModal}
            onClose={() => setShowPrizeModal(false)}
            challenge={photoChallenge}
            progress={challengeProgress}
            eventId={resolvedEventId}
            tenantId={event?.tenant_id}
            themePrimary={themePrimary}
            themeSecondary={themeSecondary}
            themeSurface={themeSurface}
            surfaceText={surfaceText}
            surfaceMuted={surfaceMuted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
