import {
  Calendar,
  MapPin,
  Users,
  Upload,
  Loader2,
  ImageIcon,
  X,
  Trophy,
  Camera,
  Check,
  UserCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoChallengePrizeModal } from '@/components/photo-challenge/prize-modal';
import { SlotMachineAnimation } from '@/components/lucky-draw/SlotMachineAnimation';
import { CheckInModal } from '@/components/attendance/CheckInModal';
import { formatDrawNumber } from '../_lib/guest-utils';
import {
  luckyNumberVariants,
  floatingButtonVariants,
} from '@/lib/animations';
import { GuestNameModal } from './GuestNameModal';
import { GuestShareModal } from './GuestShareModal';
import { HeaderActions } from './HeaderActions';
import { GalleryGrid } from './GalleryGrid';
import { PhotoLightbox } from './PhotoLightbox';
import { UploadModal } from './UploadModal';
import { useGuestEventPageController } from '../_hooks/useGuestEventPageController';
import { GuestEventPageSkeleton } from './GuestEventPageSkeleton';

type GuestEventPageViewProps = {
  controller: ReturnType<typeof useGuestEventPageController>;
};

export function GuestEventPageView({ controller }: GuestEventPageViewProps) {
  const {
    resolvedEventId, event, isLoading, error, showShareModal, showUploadModal, showCheckInModal,
    hasCheckedIn, isUploading, isOptimizing, uploadProgress, uploadError, uploadSuccess, uploadSuccessMessage,
    moderationNotice, moderationNoticeType, joinLuckyDraw, hasJoinedDraw, luckyDrawNumbers, hasActiveLuckyDrawConfig,
    photoChallenge, challengeProgress, showPrizeModal, fingerprint, recaptchaToken, recaptchaError, winner,
    showDrawOverlay, showWinnerOverlay, mergedPhotos, guestName, isAnonymous, showGuestModal, allowAnonymous,
    luckyDrawEnabled, reactionsEnabled, attendanceEnabled, photoCardStyle, themePrimary, themeSecondary, themeBackground, themeSurface,
    themeGradient, surfaceText, surfaceMuted, surfaceBorder, inputBackground, inputBorder, headerBackground,
    secondaryText, selectedFiles, caption, userLoves, animatingPhotos, selectedPhotoIds, canDownload, selectedCount,
    uploadUsageUser,
    lightboxOpen, lightboxIndex,
    loadMoreRef, hasMoreApproved, isLoadingMore, handleGuestModalSubmit, setShowGuestModal, handleLoveReaction,
    handleDownloadPhoto, handleDownloadAll, handleDownloadSelected, handleDownloadSelectedIndividually,
    toggleSelectedPhoto, openLightbox, setLightboxOpen, setLightboxIndex,
    loadMoreApproved, setShowShareModal, shareUrl, handleShare, copyToClipboard, handleFileSelect,
    removeSelectedFile, handleUpload, setShowUploadModal, setRecaptchaToken, setRecaptchaError, setCaption,
    setJoinLuckyDraw, setSelectedFiles, setUploadError, setUploadSuccess, setUploadSuccessMessage, setOptimizedCount,
    setShowCheckInModal, setHasCheckedIn, setIsAnonymous, setShowPrizeModal, setShowDrawOverlay, setShowWinnerOverlay,
  } = controller;

  // Loading state
  if (isLoading) {
    return <GuestEventPageSkeleton />;
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
        luckyDrawEnabled={luckyDrawEnabled}
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
            <HeaderActions
              luckyDrawEnabled={luckyDrawEnabled}
              canDownload={canDownload}
              selectedCount={selectedCount}
              guestName={guestName}
              isAnonymous={isAnonymous}
              themeSecondary={themeSecondary}
              secondaryText={secondaryText}
              surfaceText={surfaceText}
              surfaceBorder={surfaceBorder}
              onDownloadSelectedIndividually={handleDownloadSelectedIndividually}
              onDownloadSelected={handleDownloadSelected}
              onDownloadAll={handleDownloadAll}
              onEditName={() => setShowGuestModal(true)}
              onShare={handleShare}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Lucky Draw Section */}
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
        <GalleryGrid
          photos={mergedPhotos}
          userLoves={userLoves}
          animatingPhotos={animatingPhotos}
          selectedPhotoIds={selectedPhotoIds}
          canDownload={canDownload}
          reactionsEnabled={reactionsEnabled}
          photoCardStyle={photoCardStyle}
          hasMoreApproved={hasMoreApproved}
          isLoadingMore={isLoadingMore}
          loadMoreRef={loadMoreRef}
          surfaceText={surfaceText}
          surfaceMuted={surfaceMuted}
          surfaceBorder={surfaceBorder}
          themeSurface={themeSurface}
          inputBackground={inputBackground}
          onLoveReaction={handleLoveReaction}
          onDownloadPhoto={handleDownloadPhoto}
          onToggleSelect={toggleSelectedPhoto}
          onOpenLightbox={openLightbox}
          onLoadMore={loadMoreApproved}
        />
      </div>

      <PhotoLightbox
        open={lightboxOpen}
        index={lightboxIndex}
        photos={mergedPhotos}
        userLoves={userLoves}
        reactionsEnabled={reactionsEnabled}
        canDownload={canDownload}
        themeSecondary={themeSecondary}
        secondaryText={secondaryText}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        onLoveReaction={handleLoveReaction}
        onDownload={handleDownloadPhoto}
      />

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
      <UploadModal
        isOpen={showUploadModal}
        event={event}
        mergedPhotos={mergedPhotos}
        fingerprint={fingerprint}
        isUploading={isUploading}
        isOptimizing={isOptimizing}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
        uploadSuccessMessage={uploadSuccessMessage}
        selectedFiles={selectedFiles}
        caption={caption}
        luckyDrawEnabled={luckyDrawEnabled}
        isAnonymous={isAnonymous}
        joinLuckyDraw={joinLuckyDraw}
        hasJoinedDraw={hasJoinedDraw}
        hasActiveLuckyDrawConfig={hasActiveLuckyDrawConfig}
        photoChallenge={photoChallenge}
        challengeProgress={challengeProgress}
        guestName={guestName}
        recaptchaToken={recaptchaToken}
        recaptchaError={recaptchaError}
        allowAnonymous={allowAnonymous}
        uploadUsageUser={uploadUsageUser}
        themePrimary={themePrimary}
        themeSecondary={themeSecondary}
        themeSurface={themeSurface}
        surfaceText={surfaceText}
        surfaceMuted={surfaceMuted}
        surfaceBorder={surfaceBorder}
        inputBackground={inputBackground}
        inputBorder={inputBorder}
        secondaryText={secondaryText}
        onClose={() => {
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
        onFileSelect={handleFileSelect}
        onRemoveFile={removeSelectedFile}
        onUpload={handleUpload}
        onCaptionChange={setCaption}
        onJoinLuckyDrawChange={setJoinLuckyDraw}
        onRecaptchaVerified={(token) => {
          setRecaptchaToken(token);
          setRecaptchaError(null);
        }}
        onRecaptchaExpired={() => setRecaptchaToken(null)}
        onRecaptchaError={(err) => setRecaptchaError(err)}
      />

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
              setIsAnonymous(false);
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
