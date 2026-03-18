import { resolveModerationConfig } from './auto-moderate';

describe('resolveModerationConfig', () => {
  test('uses saved moderation settings as runtime defaults', () => {
    const config = resolveModerationConfig({
      confidence_threshold: 0.92,
      auto_reject: false,
    });

    expect(config.confidenceThreshold).toBe(0.92);
    expect(config.autoReject).toBe(false);
  });

  test('allows per-scan overrides to win over saved settings', () => {
    const config = resolveModerationConfig(
      {
        confidence_threshold: 0.92,
        auto_reject: false,
      },
      {
        autoReject: true,
        detectText: false,
      }
    );

    expect(config.confidenceThreshold).toBe(0.92);
    expect(config.autoReject).toBe(true);
    expect(config.detectText).toBe(false);
  });
});
