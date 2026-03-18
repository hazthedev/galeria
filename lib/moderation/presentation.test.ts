import type { IPhoto } from '@/lib/types';
import {
  applyModeratorPreviewToImages,
  hydrateModeratorImagePreviewUrls,
  hydrateModeratorPhotoPreviews,
} from './presentation';
import { getQuarantinePreviewUrl } from '@/lib/storage/quarantine';

jest.mock('@/lib/storage/quarantine', () => ({
  getQuarantinePreviewUrl: jest.fn(),
}));

const mockedGetQuarantinePreviewUrl = getQuarantinePreviewUrl as jest.MockedFunction<typeof getQuarantinePreviewUrl>;

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
      upload_timestamp: new Date('2026-03-19T00:00:00.000Z'),
      device_type: 'desktop',
    },
    created_at: new Date('2026-03-19T00:00:00.000Z'),
    approved_at: status === 'approved' ? new Date('2026-03-19T00:05:00.000Z') : undefined,
  };
}

describe('moderation presentation helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applies the moderator preview URL to all rendered image sizes', () => {
    const images = createPhoto('pending').images;

    expect(applyModeratorPreviewToImages(images, 'https://preview.test/photo.jpg')).toEqual({
      ...images,
      original_url: 'https://preview.test/photo.jpg',
      thumbnail_url: 'https://preview.test/photo.jpg',
      medium_url: 'https://preview.test/photo.jpg',
      full_url: 'https://preview.test/photo.jpg',
    });
  });

  test('hydrates moderator photo previews only for quarantinable statuses', async () => {
    mockedGetQuarantinePreviewUrl.mockResolvedValue('https://preview.test/pending.jpg');

    const photos = await hydrateModeratorPhotoPreviews([
      createPhoto('pending'),
      createPhoto('approved'),
    ]);

    expect(mockedGetQuarantinePreviewUrl).toHaveBeenCalledTimes(1);
    expect(mockedGetQuarantinePreviewUrl).toHaveBeenCalledWith('photo-pending');
    expect(photos[0].images.medium_url).toBe('https://preview.test/pending.jpg');
    expect(photos[1].images.medium_url).toBe('https://cdn.test/approved/medium.jpg');
  });

  test('hydrates activity thumbnails when the photo is still pending or rejected', async () => {
    mockedGetQuarantinePreviewUrl.mockResolvedValue('https://preview.test/activity.jpg');

    const records = await hydrateModeratorImagePreviewUrls([
      {
        photoId: 'photo-1',
        photoStatus: 'pending',
        imageUrl: 'https://cdn.test/pending/thumb.jpg',
      },
      {
        photoId: 'photo-2',
        photoStatus: 'approved',
        imageUrl: 'https://cdn.test/approved/thumb.jpg',
      },
      {
        photoId: null,
        photoStatus: 'rejected',
        imageUrl: 'https://cdn.test/rejected/thumb.jpg',
      },
    ]);

    expect(mockedGetQuarantinePreviewUrl).toHaveBeenCalledTimes(1);
    expect(records[0].imageUrl).toBe('https://preview.test/activity.jpg');
    expect(records[1].imageUrl).toBe('https://cdn.test/approved/thumb.jpg');
    expect(records[2].imageUrl).toBe('https://cdn.test/rejected/thumb.jpg');
  });
});
