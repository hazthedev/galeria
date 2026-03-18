jest.mock('@/lib/db', () => ({
  getTenantDb: jest.fn(),
}));

jest.mock('@/lib/images', () => ({
  deletePhotoAssets: jest.fn(),
}));

jest.mock('@/lib/lucky-draw', () => ({
  updateGuestProgress: jest.fn(),
}));

jest.mock('@/lib/realtime/server', () => ({
  publishEventBroadcast: jest.fn(),
}));

jest.mock('@/lib/storage/quarantine', () => ({
  approveQuarantinedPhoto: jest.fn(),
  getQuarantineMetadata: jest.fn(),
  purgeQuarantinedPhoto: jest.fn(),
  quarantinePhoto: jest.fn(),
  updateQuarantineStatus: jest.fn(),
}));

import { getTenantDb } from '@/lib/db';
import { updateGuestProgress } from '@/lib/lucky-draw';
import { publishEventBroadcast } from '@/lib/realtime/server';
import {
  approveQuarantinedPhoto,
  getQuarantineMetadata,
  quarantinePhoto,
  updateQuarantineStatus,
} from '@/lib/storage/quarantine';
import {
  applyAutomatedModerationResult,
  approvePhotoManually,
  rejectPhotoManually,
} from './service';

type MockPhoto = {
  id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected';
  user_fingerprint: string;
  is_anonymous: boolean;
  images: {
    thumbnail_url: string;
    full_url: string;
  };
};

const mockedGetTenantDb = getTenantDb as jest.MockedFunction<typeof getTenantDb>;
const mockedUpdateGuestProgress = updateGuestProgress as jest.MockedFunction<typeof updateGuestProgress>;
const mockedPublishEventBroadcast = publishEventBroadcast as jest.MockedFunction<typeof publishEventBroadcast>;
const mockedApproveQuarantinedPhoto = approveQuarantinedPhoto as jest.MockedFunction<typeof approveQuarantinedPhoto>;
const mockedGetQuarantineMetadata = getQuarantineMetadata as jest.MockedFunction<typeof getQuarantineMetadata>;
const mockedQuarantinePhoto = quarantinePhoto as jest.MockedFunction<typeof quarantinePhoto>;
const mockedUpdateQuarantineStatus = updateQuarantineStatus as jest.MockedFunction<typeof updateQuarantineStatus>;

function wireDb(photo: MockPhoto | null) {
  const query = jest.fn(async (text: string) => {
    if (text.includes('FROM photos')) {
      return { rows: photo ? [photo] : [], rowCount: photo ? 1 : 0 };
    }

    if (text.includes('SELECT to_regclass')) {
      return { rows: [{ name: 'photo_moderation_logs' }], rowCount: 1 };
    }

    if (
      text.includes('UPDATE photos SET status') ||
      text.includes('INSERT INTO photo_moderation_logs') ||
      text.includes('DELETE FROM photos')
    ) {
      return { rows: [], rowCount: 1 };
    }

    throw new Error(`Unexpected query: ${text}`);
  });

  mockedGetTenantDb.mockReturnValue({
    transact: async (callback: (client: { query: typeof query }) => Promise<unknown>) =>
      callback({ query }),
  } as never);

  return { query };
}

describe('moderation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetQuarantineMetadata.mockResolvedValue(null);
    mockedUpdateGuestProgress.mockResolvedValue({ progress: null, goalJustReached: false });
    mockedPublishEventBroadcast.mockResolvedValue();
    mockedApproveQuarantinedPhoto.mockResolvedValue();
    mockedQuarantinePhoto.mockResolvedValue({
      photoId: 'photo-1',
      eventId: 'event-1',
      originalPath: 'event-1/photo-1',
      status: 'pending',
      flaggedAt: new Date(),
      expiresAt: new Date(),
    });
    mockedUpdateQuarantineStatus.mockResolvedValue(null);
  });

  test('skips automated moderation when the photo is no longer pending', async () => {
    wireDb({
      id: 'photo-1',
      event_id: 'event-1',
      status: 'approved',
      user_fingerprint: 'guest_1',
      is_anonymous: false,
      images: {
        thumbnail_url: 'thumb',
        full_url: 'full',
      },
    });

    const result = await applyAutomatedModerationResult({
      tenantId: 'tenant-1',
      photoId: 'photo-1',
      moderationResult: {
        action: 'reject',
        reason: 'Detected unsafe content',
        categories: ['unsafe'],
      },
    });

    expect(result.outcome).toBe('skipped');
    expect(result.message).toContain('already approved');
    expect(mockedQuarantinePhoto).not.toHaveBeenCalled();
    expect(mockedPublishEventBroadcast).not.toHaveBeenCalled();
  });

  test('manual reject quarantines the photo and broadcasts the new rejected status', async () => {
    wireDb({
      id: 'photo-1',
      event_id: 'event-1',
      status: 'pending',
      user_fingerprint: 'guest_1',
      is_anonymous: false,
      images: {
        thumbnail_url: 'thumb',
        full_url: 'full',
      },
    });

    const result = await rejectPhotoManually({
      tenantId: 'tenant-1',
      photoId: 'photo-1',
      moderatorId: 'moderator-1',
      reason: 'Manual reject',
    });

    expect(result.outcome).toBe('applied');
    expect(mockedQuarantinePhoto).toHaveBeenCalledWith('event-1', 'photo-1', 'Manual reject', undefined);
    expect(mockedUpdateQuarantineStatus).toHaveBeenCalledWith(
      'photo-1',
      expect.objectContaining({
        status: 'rejected',
        reviewedBy: 'moderator-1',
      })
    );
    expect(mockedPublishEventBroadcast).toHaveBeenCalledWith(
      'event-1',
      'photo_updated',
      expect.objectContaining({
        photo_id: 'photo-1',
        status: 'rejected',
      })
    );
  });

  test('manual approve restores quarantined photos and increments challenge progress once', async () => {
    wireDb({
      id: 'photo-1',
      event_id: 'event-1',
      status: 'pending',
      user_fingerprint: 'guest_1',
      is_anonymous: false,
      images: {
        thumbnail_url: 'thumb',
        full_url: 'full',
      },
    });

    mockedGetQuarantineMetadata.mockResolvedValue({
      photoId: 'photo-1',
      eventId: 'event-1',
      originalPath: 'event-1/photo-1',
      status: 'pending',
      flaggedAt: new Date(),
      expiresAt: new Date(),
    });

    const result = await approvePhotoManually({
      tenantId: 'tenant-1',
      photoId: 'photo-1',
      moderatorId: 'moderator-1',
      reason: 'Looks good',
    });

    expect(result.outcome).toBe('applied');
    expect(mockedApproveQuarantinedPhoto).toHaveBeenCalledWith('photo-1', 'moderator-1');
    expect(mockedUpdateGuestProgress).toHaveBeenCalledWith(
      expect.anything(),
      'event-1',
      'guest_1',
      true
    );
    expect(mockedPublishEventBroadcast).toHaveBeenCalledWith(
      'event-1',
      'photo_updated',
      expect.objectContaining({
        photo_id: 'photo-1',
        status: 'approved',
      })
    );
  });
});
