import {
  Calendar,
  MapPin,
  Users,
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

// Theme colors via CSS variables (--g-*) — set on the root container
const v = {
  text: 'var(--g-text)',
  muted: 'var(--g-muted)',
  border: 'var(--g-border)',
  surface: 'var(--g-surface)',
  inputBg: 'var(--g-input-bg)',
  headerBg: 'var(--g-header-bg)',
  secondary: 'var(--g-secondary)',
} as const;

export function GuestEventPageView({ controller }: GuestEventPageViewProps) {
  const {
    resolvedEventId, event, isLoading, error, showShareModal, showUploadModal, showCheckInModal,
    hasCheckedIn, isUploading, isOptimizing, uploadProgress, uploadError, uploadSuccess, uploadSuccessMessage,
    moderationNotice, moderationNoticeType, joinLuckyDraw, hasJoinedDraw, luckyDrawNumbers, hasActiveLuckyDrawConfig,
    photoChallenge, challengeProgress, showPrizeModal, fingerprint, recaptchaToken, recaptchaError, winner,
    showDrawOverlay, showWinnerOverlay, mergedPhotos, guestName, isAnonymous, showGuestModal, allowAnonymous,
    luckyDrawEnabled, reactionsEnabled, attendanceEnabled, photoCardStyle, themePrimary, themeSecondary, themeBackground, themeSurface,
    themeGradient, surfaceText, surfaceMuted, surfaceBorder, inputBackground, inputBorder, headerBackground,
    secondaryText, selectedFiles, caption, userLoves, animatingPhotos, selectedPhotoIds, canDownload, lightboxEnabled, selectedCount,
    galleryFilter, setGalleryFilter, filteredPhotos,
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
    <div
      className="min-h-screen"
      style={{
        background: themeBackground,
        '--g-primary': themePrimary,
        '--g-secondary': themeSecondary,
        '--g-surface': themeSurface,
        '--g-text': surfaceText,
        '--g-muted': surfaceMuted,
        '--g-border': surfaceBorder,
        '--g-input-bg': inputBackground,
        '--g-input-border': inputBorder,
        '--g-header-bg': headerBackground,
        '--g-secondary-text': secondaryText,
      } as React.CSSProperties}
    >
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
            style={{ backgroundColor: v.surface, color: v.text, borderColor: v.border }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-snug tracking-tight" style={{ color: v.text }}>
                Lucky Draw
              </h3>
              <button
                onClick={() => setShowDrawOverlay(false)}
                className="hover:opacity-80"
                style={{ color: v.muted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-sm font-medium" style={{ color: v.text }}>
                The lucky draw is starting...
              </p>
              <p className="text-xs" style={{ color: v.muted }}>
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
            style={{ backgroundColor: v.surface, color: v.text, borderColor: v.border }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-snug tracking-tight" style={{ color: v.text }}>
                Winner Announced
              </h3>
              <button
                onClick={() => setShowWinnerOverlay(false)}
                className="hover:opacity-80"
                style={{ color: v.muted }}
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
        style={{ backgroundColor: v.headerBg, borderColor: v.border }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl" style={{ color: v.text }}>
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm leading-normal" style={{ color: v.muted }}>
                {event.custom_hashtag && (
                  <span>#{event.custom_hashtag}</span>
                )}
                {(guestName || isAnonymous) && (
                  <span>Hi, {isAnonymous ? 'Anonymous' : guestName}!</span>
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
              onDownloadSelectedIndividually={handleDownloadSelectedIndividually}
              onDownloadSelected={handleDownloadSelected}
              onDownloadAll={handleDownloadAll}
              onEditName={() => setShowGuestModal(true)}
              onShare={handleShare}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Event Details — Compact Pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2" style={{ color: v.text }}>
          {[
            { icon: <Calendar className="h-3 w-3" style={{ color: v.secondary }} />, text: formattedDate },
            event.location ? { icon: <MapPin className="h-3 w-3" style={{ color: v.secondary }} />, text: event.location } : null,
            event.expected_guests ? { icon: <Users className="h-3 w-3" style={{ color: v.secondary }} />, text: `${event.expected_guests} guests` } : null,
            { icon: <ImageIcon className="h-3 w-3" style={{ color: v.secondary }} />, text: `${mergedPhotos.length} photos` },
          ].filter(Boolean).map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: v.inputBg }}
            >
              {item!.icon}
              {item!.text}
            </div>
          ))}
        </div>

        {event.description && (
          <p className="mb-6 max-w-prose text-sm leading-relaxed" style={{ color: v.muted }}>
            {event.description}
          </p>
        )}

        {/* Lucky Draw Section — compact when empty, expanded when has numbers */}
        {luckyDrawEnabled && (
          <section id="lucky-draw" className="mb-6 scroll-mt-24">
            {luckyDrawNumbers.length > 0 ? (
              <div
                className="rounded-2xl border p-5 shadow-sm sm:p-6"
                style={{ backgroundColor: v.surface, borderColor: v.border }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4" style={{ color: v.secondary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: v.secondary }}>
                    Your Lucky Draw Numbers
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {luckyDrawNumbers.map((number, index) => (
                    <motion.span
                      key={`${number}-${index}`}
                      custom={index}
                      variants={luckyNumberVariants}
                      initial="hidden"
                      animate="visible"
                      className="rounded-full px-4 py-2 text-sm font-bold shadow-sm"
                      style={{
                        backgroundColor: themeSecondary,
                        color: secondaryText,
                      }}
                    >
                      #{number}
                    </motion.span>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ backgroundColor: v.inputBg, borderColor: v.border }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: themeSecondary, color: secondaryText }}
                >
                  <Trophy className="h-4 w-4" />
                </div>
                <p className="text-sm" style={{ color: v.muted }}>
                  {hasJoinedDraw
                    ? 'You\'re in the draw! Your number will appear shortly.'
                    : 'Upload a photo to enter the lucky draw and win prizes.'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Upload CTA */}
        {moderationNotice && (
          <div
            className={clsx(
              'mb-4 rounded-lg px-4 py-3 text-sm font-medium',
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
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setRecaptchaToken(null);
              setRecaptchaError(null);
            }}
            className="group w-full overflow-hidden rounded-2xl p-6 text-left transition-all duration-200 ease-out hover:shadow-lg sm:p-8"
            style={{
              backgroundImage: `linear-gradient(135deg, ${themePrimary}18, ${themeSecondary}18)`,
              borderColor: v.border,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-110"
                style={{ backgroundImage: `linear-gradient(135deg, ${themePrimary}, ${themeSecondary})` }}
              >
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg" style={{ color: v.text }}>
                  Add your photos
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: v.muted }}>
                  Capture and share your favorite moments
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Gallery Filter Pills */}
        {mergedPhotos.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {([
              { key: 'all' as const, label: 'All' },
              { key: 'mine' as const, label: 'My Photos' },
              { key: 'most_loved' as const, label: 'Most Loved' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setGalleryFilter(key)}
                className={clsx(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ease-out',
                  galleryFilter === key
                    ? 'shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                )}
                style={galleryFilter === key
                  ? { backgroundColor: themeSecondary, color: secondaryText }
                  : { backgroundColor: v.inputBg, color: v.text }
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Photo Gallery */}
        <GalleryGrid
          photos={filteredPhotos}
          userLoves={userLoves}
          animatingPhotos={animatingPhotos}
          selectedPhotoIds={selectedPhotoIds}
          canDownload={canDownload}
          reactionsEnabled={reactionsEnabled}
          photoCardStyle={photoCardStyle}
          hasMoreApproved={hasMoreApproved}
          isLoadingMore={isLoadingMore}
          loadMoreRef={loadMoreRef}
          onLoveReaction={handleLoveReaction}
          onDownloadPhoto={handleDownloadPhoto}
          onToggleSelect={toggleSelectedPhoto}
          onOpenLightbox={openLightbox}
          lightboxEnabled={lightboxEnabled}
          onLoadMore={loadMoreApproved}
        />
      </div>

      {lightboxEnabled && (
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
      )}

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
