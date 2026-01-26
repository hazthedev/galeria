// ============================================
// MOMENTIQUE - Admin Tenants API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';
import { createTenant, clearTenantCache } from '@/lib/tenant';
import type { ITenant, SubscriptionTier } from '@/lib/types';

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim();
    const status = url.searchParams.get('status') || 'all';
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 5), 100);
    const offset = (page - 1) * limit;

    const db = getTenantDb(SYSTEM_TENANT_ID);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(`(
        brand_name ILIKE $${paramIndex} OR
        company_name ILIKE $${paramIndex} OR
        contact_email ILIKE $${paramIndex} OR
        domain ILIKE $${paramIndex} OR
        subdomain ILIKE $${paramIndex}
      )`);
      params.push(like);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataResult = await db.query<ITenant>(
      `
        SELECT *
        FROM tenants
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      [...params, limit, offset]
    );

    const countResult = await db.query<{ count: string }>(
      `
        SELECT COUNT(*) as count
        FROM tenants
        ${whereClause}
      `,
      params
    );

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('[ADMIN_TENANTS] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();
    const {
      tenant_type,
      brand_name,
      company_name,
      contact_email,
      domain,
      subdomain,
      subscription_tier,
    } = body || {};

    if (!tenant_type || !brand_name || !company_name || !contact_email) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const tenant = await createTenant({
      tenant_type,
      brand_name,
      company_name,
      contact_email,
      domain: domain || undefined,
      subdomain: subdomain || undefined,
      subscription_tier: (subscription_tier || 'free') as SubscriptionTier,
    });

    clearTenantCache();

    return NextResponse.json({
      data: tenant,
      message: 'Tenant created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_TENANTS] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tenant', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

