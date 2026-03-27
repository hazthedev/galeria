import type { IPhoto } from '@/lib/types';
import { redactRejectedPhotosForGuest } from './guest-visibility';

function createPhoto(status: IPhoto['status']): IPhoto {
  return {
    id: `photo-${status}`,
    event_id: 'event-1',
    user_fingerprint: 'guest_1',
    images: {
      original_url: `https://cdn.test/${status}/original.jpg`,
      thumbnail_url: `https://cdn.test/${status}/thumb.jpg`,
      medium_url: `https://cdn.test/${status}/medium.jpg`,
      full_url: `https://cdn.test/${status}/full.jpg`,
      width: 1200,
      height: 800,
      file_size: 1024,
      format: 'jpg',
    },
    caption: 'Sample photo',
    contributor_name: 'Guest',
    is_anonymous: false,
    status,
    reactions: {
      heart: 0,
      clap: 0,
      laugh: 0,
      wow: 0,
    },
    metadata: {
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      upload_timestamp: new Date('2026-03-27T00:00:00.000Z'),
      device_type: 'desktop',
    },
    created_at: new Date('2026-03-27T00:00:00.000Z'),
  };
}

describe('guest moderation visibility', () => {
  test('redacts rejected photo image URLs for guests', () => {
    const [rejected] = redactRejectedPhotosForGuest([createPhoto('rejected')]);

    expect(rejected.images).toMatchObject({
      original_url: '/icons/galeria-icon-frame.svg',
      thumbnail_url: '/icons/galeria-icon-frame.svg',
      medium_url: '/icons/galeria-icon-frame.svg',
      full_url: '/icons/galeria-icon-frame.svg',
    });
  });

  test('keeps approved and pending photos unchanged', () => {
    const [approved, pending] = redactRejectedPhotosForGuest([
      createPhoto('approved'),
      createPhoto('pending'),
    ]);

    expect(approved.images.medium_url).toBe('https://cdn.test/approved/medium.jpg');
    expect(pending.images.medium_url).toBe('https://cdn.test/pending/medium.jpg');
  });
});
