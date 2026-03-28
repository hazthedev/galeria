import { NextRequest, NextResponse } from 'next/server';
import { createTenantContext } from '@/lib/domain/tenant/tenant';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostname = (searchParams.get('host') || '').trim().toLowerCase();

    if (!hostname) {
      return NextResponse.json(
        { error: 'host query parameter is required', code: 'MISSING_HOST' },
        { status: 400 }
      );
    }

    const tenantContext = await createTenantContext(hostname);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: tenantContext.tenant.id,
          tenantType: tenantContext.tenant.tenant_type,
          tenantTier: tenantContext.tenant.subscription_tier,
          tenantName: tenantContext.tenant.brand_name,
          branding: tenantContext.tenant.branding,
          features: tenantContext.tenant.features_enabled,
          limits: tenantContext.tenant.limits,
          status: tenantContext.tenant.status,
          isCustomDomain: tenantContext.is_custom_domain,
          isMaster: tenantContext.is_master,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[TENANT_CONTEXT] Failed to resolve tenant context:', error);
    return NextResponse.json(
      { error: 'Failed to resolve tenant context', code: 'TENANT_CONTEXT_ERROR' },
      { status: 500 }
    );
  }
}
