export * from '@/lib/api/middleware/fingerprint';
export * from '@/lib/api/middleware/limit-check';
export * from '@/lib/api/middleware/rate-limit';
// export * from '@/lib/api/middleware/recaptcha'; // Conflicts with rate-limit.ts exports

// Manually export recaptcha functions
export {
  generateMathChallenge,
  verifyChallenge,
  issueFallbackToken,
  storeChallenge,
  cleanupChallenge,
  getRecaptchaSiteKey,
  shouldRenderRecaptcha,
  verifyRecaptchaToken,
  validateRecaptchaForUpload,
  isRecaptchaRequiredForUploads,
} from '@/lib/api/middleware/recaptcha';
