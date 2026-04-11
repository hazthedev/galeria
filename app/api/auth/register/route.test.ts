import { NextRequest } from 'next/server';

const mockCreateSession = jest.fn();
const mockCheckRegistrationRateLimit = jest.fn();
const mockValidatePassword = jest.fn();
const mockGetRequestIp = jest.fn();
const mockGetRequestUserAgent = jest.fn();
const mockCreateTenant = jest.fn();
const mockDeleteTenantById = jest.fn();
const mockResolveOrProvisionAppUser = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock('@/lib/domain/auth/session', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
}));

jest.mock('@/lib/api/middleware/rate-limit', () => ({
  checkRegistrationRateLimit: (...args: unknown[]) => mockCheckRegistrationRateLimit(...args),
  createRateLimitErrorResponse: jest.fn(() => ({
    success: false,
    error: 'RATE_LIMITED',
    retryAfter: 60,
  })),
}));

jest.mock('@/lib/auth', () => ({
  DEFAULT_PASSWORD_REQUIREMENTS: {},
  validatePassword: (...args: unknown[]) => mockValidatePassword(...args),
}));

jest.mock('../../../../middleware/auth', () => ({
  getRequestIp: (...args: unknown[]) => mockGetRequestIp(...args),
  getRequestUserAgent: (...args: unknown[]) => mockGetRequestUserAgent(...args),
}));

jest.mock('@/lib/domain/tenant/tenant', () => ({
  createTenant: (...args: unknown[]) => mockCreateTenant(...args),
  deleteTenantById: (...args: unknown[]) => mockDeleteTenantById(...args),
}));

jest.mock('@/lib/domain/auth/provision-app-user', () => ({
  resolveOrProvisionAppUser: (...args: unknown[]) => mockResolveOrProvisionAppUser(...args),
}));

jest.mock('@/lib/infrastructure/auth/supabase-server', () => ({
  isSupabaseAuthConfigured: jest.fn(() => true),
  isSupabaseAdminConfigured: jest.fn(() => true),
  getSupabaseAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  })),
  getSupabaseServerAuthClient: jest.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  })),
}));

describe('POST /api/auth/register', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockCheckRegistrationRateLimit.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: new Date('2026-04-11T00:00:00.000Z'),
    });
    mockValidatePassword.mockReturnValue({ valid: true, errors: [] });
    mockGetRequestIp.mockReturnValue('127.0.0.1');
    mockGetRequestUserAgent.mockReturnValue('jest');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function buildRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  it('rejects registration when workspace name is missing', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      buildRequest({
        email: 'owner@example.com',
        password: 'Password123',
        name: 'Owner Name',
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreateTenant).not.toHaveBeenCalled();
  });

  it('creates a dedicated tenant and organizer user for a new signup', async () => {
    const createdTenant = { id: 'tenant-1' };
    const appUser = {
      id: 'auth-1',
      tenant_id: 'tenant-1',
      email: 'owner@example.com',
      name: 'Owner Name',
      role: 'organizer',
      subscription_tier: 'free',
      email_verified: true,
      created_at: new Date('2026-04-11T00:00:00.000Z'),
      updated_at: new Date('2026-04-11T00:00:00.000Z'),
    };

    mockCreateTenant.mockResolvedValue(createdTenant);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'auth-1', email: 'owner@example.com' } },
      error: null,
    });
    mockResolveOrProvisionAppUser.mockResolvedValue(appUser);
    mockCreateSession.mockResolvedValue('session-123');

    const { POST } = await import('./route');

    const response = await POST(
      buildRequest({
        tenantName: 'Lily Events Studio',
        email: 'Owner@Example.com',
        password: 'Password123',
        name: 'Owner Name',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateTenant).toHaveBeenCalledWith({
      tenant_type: 'white_label',
      brand_name: 'Lily Events Studio',
      company_name: 'Lily Events Studio',
      contact_email: 'owner@example.com',
      subscription_tier: 'free',
    });
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'Password123',
      email_confirm: true,
      user_metadata: expect.objectContaining({
        tenant_id: 'tenant-1',
        tenant_name: 'Lily Events Studio',
        role: 'organizer',
        subscription_tier: 'free',
      }),
    });
    expect(payload.success).toBe(true);
    expect(mockDeleteTenantById).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('cleans up a newly created tenant when the email already exists', async () => {
    mockCreateTenant.mockResolvedValue({ id: 'tenant-1' });
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    const { POST } = await import('./route');

    const response = await POST(
      buildRequest({
        tenantName: 'Duplicate Workspace',
        email: 'owner@example.com',
        password: 'Password123',
        name: 'Owner Name',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe('USER_ALREADY_EXISTS');
    expect(mockDeleteTenantById).toHaveBeenCalledWith('tenant-1');
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('rolls back auth and tenant artifacts when post-create sign-in fails', async () => {
    mockCreateTenant.mockResolvedValue({ id: 'tenant-1' });
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('sign in failed'),
    });

    const { POST } = await import('./route');

    const response = await POST(
      buildRequest({
        tenantName: 'Broken Workspace',
        email: 'owner@example.com',
        password: 'Password123',
        name: 'Owner Name',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('INTERNAL_ERROR');
    expect(mockDeleteUser).toHaveBeenCalledWith('auth-1');
    expect(mockDeleteTenantById).toHaveBeenCalledWith('tenant-1');
  });
});
