import Image from 'next/image';
import {
  X,
  Check,
  Camera,
  ImageIcon,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoChallengeProgressBar } from '@/components/photo-challenge/progress-bar';
import { Recaptcha } from '@/components/auth/Recaptcha';
import type { IEvent, IPhotoChallenge, IGuestPhotoProgress, IPhoto } from '@/lib/types';
import type { SelectedFile } from '../_hooks/useGuestEventPageController';
import {
  modalBackdropVariants,
  modalContentVariants,
  fileCardVariants,
} from '@/lib/animations';

export interface UploadModalProps {
  isOpen: boolean;
  event: IEvent;
  mergedPhotos: IPhoto[];
  fingerprint: string | null;
  isUploading: boolean;
  isOptimizing: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadSuccess: boolean;
  uploadSuccessMessage: string;
  selectedFiles: SelectedFile[];
  caption: string;
  luckyDrawEnabled: boolean;
  isAnonymous: boolean;
  joinLuckyDraw: boolean;
  hasJoinedDraw: boolean;
  hasActiveLuckyDrawConfig: boolean | null;
  photoChallenge: IPhotoChallenge | null;
  challengeProgress: IGuestPhotoProgress | null;
  guestName: string;
  recaptchaToken: string | null;
  recaptchaError: string | null;
  allowAnonymous: boolean;
  uploadUsageUser: { used: number; limit: number; remaining: number } | null;
  themePrimary: string;
  themeSecondary: string;
  themeSurface: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceBorder: string;
  inputBackground: string;
  inputBorder: string;
  secondaryText: string;
  onClose: () => void;
  onFileSelect: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
  onCaptionChange: (caption: string) => void;
  onJoinLuckyDrawChange: (join: boolean) => void;
  onRecaptchaVerified: (token: string) => void;
  onRecaptchaExpired: () => void;
  onRecaptchaError: (err: string) => void;
}

export function UploadModal({
  isOpen,
  event,
  mergedPhotos,
  fingerprint,
  isUploading,
  isOptimizing,
  uploadProgress,
  uploadError,
  uploadSuccess,
  uploadSuccessMessage,
  selectedFiles,
  caption,
  luckyDrawEnabled,
  isAnonymous,
  joinLuckyDraw,
  hasJoinedDraw,
  hasActiveLuckyDrawConfig,
  photoChallenge,
  challengeProgress,
  guestName,
  recaptchaToken,
  recaptchaError,
  allowAnonymous,
  uploadUsageUser,
  themePrimary,
  themeSecondary,
  themeSurface,
  surfaceText,
  surfaceMuted,
  surfaceBorder,
  inputBackground,
  inputBorder,
  secondaryText,
  onClose,
  onFileSelect,
  onRemoveFile,
  onUpload,
  onCaptionChange,
  onJoinLuckyDrawChange,
  onRecaptchaVerified,
  onRecaptchaExpired,
  onRecaptchaError,
}: UploadModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
              className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: themeSurface, color: surfaceText, borderColor: surfaceBorder, boxShadow: '0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.12), 0 24px 64px rgba(0,0,0,0.08)' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-snug tracking-tight" style={{ color: surfaceText }}>
                  Upload Photo
                </h3>
                <button
                  onClick={onClose}
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
                  </p>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {uploadError}
                </div>
              )}

              {/* Uploading / Optimizing State */}
              {(isUploading || isOptimizing) && (
                <div
                  className="mb-4 flex flex-col items-center gap-3 rounded-lg p-6"
                  style={{ backgroundColor: inputBackground }}
                >
                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium" style={{ color: surfaceText }}>
                      <span>{isOptimizing ? 'Optimizing large photos...' : 'Uploading photos...'}</span>
                      <span>{isOptimizing ? '' : `${uploadProgress}%`}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: surfaceBorder }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: isOptimizing ? '100%' : `${Math.max(uploadProgress, 5)}%`,
                          backgroundColor: themeSecondary,
                          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: isOptimizing ? 'indeterminate-progress 1.5s ease-in-out infinite' : undefined,
                          transformOrigin: 'left center',
                        }}
                      />
                    </div>
                  </div>
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
                                onClick={() => onRemoveFile(index)}
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
                      <label
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors duration-150 ease-out hover:opacity-90"
                        style={{ borderColor: themePrimary, backgroundColor: inputBackground }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => onFileSelect(e.target.files)}
                          className="hidden"
                        />
                        <Camera className="h-8 w-8" style={{ color: themeSecondary }} />
                        <span className="text-xs font-semibold" style={{ color: surfaceText }}>
                          Camera
                        </span>
                      </label>

                      <label
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors duration-150 ease-out hover:opacity-90"
                        style={{ borderColor: themePrimary, backgroundColor: inputBackground }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => onFileSelect(e.target.files)}
                          className="hidden"
                        />
                        <ImageIcon className="h-8 w-8" style={{ color: themeSecondary }} />
                        <span className="text-xs font-semibold" style={{ color: surfaceText }}>
                          Gallery
                        </span>
                      </label>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-center" style={{ color: surfaceMuted }}>
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
                      onChange={(e) => onCaptionChange(e.target.value)}
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
                          onChange={(e) => onJoinLuckyDrawChange(e.target.checked)}
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
                          <p className="mt-1 text-xs leading-relaxed" style={{ color: surfaceMuted }}>
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

                  {allowAnonymous && isAnonymous && luckyDrawEnabled && (
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Anonymous users cannot participate in the lucky draw
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
                          onRecaptchaVerified(token);
                        }}
                        onExpired={() => {
                          onRecaptchaExpired();
                        }}
                        onError={(err) => onRecaptchaError(err)}
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
                      onClick={onUpload}
                      disabled={isUploading || isOptimizing}
                      className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: themeSecondary, color: secondaryText }}
                    >
                      Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                    </button>
                  )}

                  {/* Photos Remaining Info */}
                  {(() => {
                    const fallbackUserLimit = event?.settings?.limits?.max_photos_per_user;
                    const fallbackUserPhotos = mergedPhotos.filter((photo) => photo.user_fingerprint === `guest_${fingerprint}`).length;

                    const userLimit = uploadUsageUser?.limit ?? fallbackUserLimit;
                    const userPhotos = uploadUsageUser?.used ?? fallbackUserPhotos;
                    const remaining = uploadUsageUser?.remaining
                      ?? (userLimit === null || userLimit === undefined ? -1 : Math.max(0, userLimit - userPhotos));

                    return (
                      <p className="text-xs leading-relaxed text-center" style={{ color: surfaceMuted }}>
                        {remaining === -1
                          ? `${userPhotos} uploaded`
                          : `${remaining} photo${remaining === 1 ? '' : 's'} remaining`}
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
  );
}
