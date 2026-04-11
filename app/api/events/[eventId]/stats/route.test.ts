import { NextRequest } from 'next/server';

const mockResolveOptionalAuth = jest.fn();
const mockResolveTenantId = jest.fn();
const mockGetEffectiveTenantEntitlements = jest.fn();
const mockGetTierConfig = jest.fn();
const mockNormalizeSubscriptionTier = jest.fn();
const mockDbQuery = jest.fn();

jest.mock('@/lib/db', () => ({
  getTenantDb: jest.fn(() => ({
    query: (...args: unknown[]) => mockDbQuery(...args),
  })),
}));

jest.mock('@/lib/tenant', () => ({
  getEffectiveTenantEntitlements: (...args: unknown[]) =>
    mockGetEffectiveTenantEntitlements(...args),
  getTierConfig: (...args: unknown[]) => mockGetTierConfig(...args),
  normalizeSubscriptionTier: (...args: unknown[]) => mockNormalizeSubscriptionTier(...args),
}));

jest.mock('@/lib/api/api-request-context', () => ({
  resolveOptionalAuth: (...args: unknown[]) => mockResolveOptionalAuth(...args),
  resolveTenantId: (...args: unknown[]) => mockResolveTenantId(...args),
}));

describe('GET /api/events/[eventId]/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockResolveOptionalAuth.mockResolvedValue({
      userId: 'user-1',
      role: 'organizer',
      tenantId: 'system-tenant',
    });
    mockResolveTenantId.mockReturnValue('system-tenant');
    mockNormalizeSubscriptionTier.mockReturnValue('free');
    mockGetTierConfig.mockReturnValue({
      limits: {
        max_photos_per_event: 20,
      },
    });
    mockGetEffectiveTenantEntitlements.mockResolvedValue({
      tier: 'free',
      displayName: 'Free',
      limits: {
        max_photos_per_event: 20,
      },
      features: {
        advanced_analytics: false,
        lucky_draw: false,
      },
    });

    mockDbQuery
      .mockResolvedValueOnce({
        rows: [
          {
            organizer_id: 'user-1',
            tenant_id: 'event-tenant',
            subscription_tier: 'free',
            settings: {},
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            total_photos: 0,
            total_participants: 0,
            photos_today: 0,
            total_reactions: 0,
            pending_moderation: 0,
            top_contributors: [],
            upload_timeline: [],
            top_liked_photos: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      });
  });

  it('uses the event tenant for entitlements even when request tenant context differs', async () => {
    const { GET } = await import('./route');

    const response = await GET(
      new NextRequest('http://localhost/api/events/event-1/stats', {
        headers: {
          cookie: 'session=test',
        },
      }),
      { params: Promise.resolve({ eventId: 'event-1' }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetEffectiveTenantEntitlements).toHaveBeenCalledWith('event-tenant', 'free');
    expect(payload.data.tierDisplayName).toBe('Free');
  });
});
