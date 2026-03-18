# Super Admin Module - Implementation Plan

**Date:** 2026-03-19
**Status:** Ready for Implementation
**Based on:** `super-admin-module-analysis-2026-03-19.md`

---

## Phase 1: Security Hardening (Week 1-2) - P0

### Task 1.1: Create Audit Logging System

**File:** `drizzle/migrations/XXXX_add_admin_audit_logs.sql`

```sql
-- ============================================
-- Admin Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
```

**File:** `lib/audit/index.ts`

```typescript
import 'server-only';
import { getTenantDb } from '@/lib/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

export type AuditAction =
  | 'user.role_changed'
  | 'user.tier_changed'
  | 'user.deleted'
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.suspended'
  | 'settings.updated'
  | 'moderation.updated';

export interface AuditLogOptions {
  adminId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(options: AuditLogOptions): Promise<void> {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  await db.query(
    `INSERT INTO admin_audit_logs (
      admin_id, action, target_type, target_id,
      old_values, new_values, reason, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      options.adminId,
      options.action,
      options.targetType || null,
      options.targetId || null,
      options.oldValues ? JSON.stringify(options.oldValues) : null,
      options.newValues ? JSON.stringify(options.newValues) : null,
      options.reason || null,
      options.ipAddress || null,
      options.userAgent || null,
    ]
  );
}

export async function getAuditLogs(filters: {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.adminId) {
    conditions.push(`admin_id = $${paramIndex++}`);
    params.push(filters.adminId);
  }

  if (filters.action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(filters.action);
  }

  if (filters.targetType) {
    conditions.push(`target_type = $${paramIndex++}`);
    params.push(filters.targetType);
  }

  if (filters.targetId) {
    conditions.push(`target_id = $${paramIndex++}`);
    params.push(filters.targetId);
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await db.query(
    `SELECT
      a.*,
      u.name as admin_name,
      u.email as admin_email
    FROM admin_audit_logs a
    LEFT JOIN users u ON u.id = a.admin_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return result.rows;
}
```

**File:** `lib/audit/middleware.ts`

```typescript
import type { NextRequest } from 'next/server';
import { logAdminAction } from './audit';
import { getRequestIp, getRequestUserAgent } from '@/middleware/auth';

export async function withAuditLog<T>(
  request: NextRequest,
  adminId: string,
  action: string,
  fn: () => Promise<T>,
  options?: {
    targetType?: string;
    targetId?: string;
    getOldValues?: () => Record<string, unknown>;
    getNewValues?: (result: T) => Record<string, unknown>;
    reason?: string;
  }
): Promise<T> {
  const oldValues = options?.getOldValues?.();

  try {
    const result = await fn();

    await logAdminAction({
      adminId,
      action: action as any,
      targetType: options?.targetType,
      targetId: options?.targetId,
      oldValues,
      newValues: options?.getNewValues?.(result),
      reason: options?.reason,
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return result;
  } catch (error) {
    await logAdminAction({
      adminId,
      action: `${action}.failed` as any,
      targetType: options?.targetType,
      targetId: options?.targetId,
      oldValues,
      newValues: { error: error instanceof Error ? error.message : String(error) },
      reason: options?.reason,
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });
    throw error;
  }
}
```

### Task 1.2: Fix Self-Role Demotion Bug

**File:** `app/api/admin/users/[userId]/route.ts`

```typescript
// In PATCH function, after line 43 (after role validation):
// Add self-role demotion protection

if (role !== undefined) {
  // ... existing validation ...

  // NEW: Prevent self-role demotion
  if (userId === auth.user.id && role !== 'super_admin') {
    return NextResponse.json(
      {
        error: 'Cannot demote yourself from super_admin role',
        code: 'SELF_DEMOTION_FORBIDDEN',
      },
      { status: 403 }
    );
  }

  updates.push(`role = $${paramIndex++}`);
  values.push(role);
}
```

### Task 1.3: Fix SQL Parameter Bug

**File:** `app/api/admin/users/route.ts`

```typescript
// In GET function, line 37:
// OLD CODE (BUGGY):
if (search) {
  whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
  params.push(`%${search}%`);
  paramIndex++;
}

// NEW CODE (FIXED):
if (search) {
  whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex + 1})`;
  params.push(`%${search}%`, `%${search}%`);
  paramIndex += 2;
}
```

### Task 1.4: Add Confirmation Dialog Component

**File:** `components/admin/ConfirmDialog.tsx`

```typescript
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'warning'
                ? 'bg-orange-600 hover:bg-orange-700'
                : undefined
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Usage in `app/admin/users/page.tsx`:**

```typescript
const [confirmDialog, setConfirmDialog] useState<{
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}>({ open: false, title: '', description: '', onConfirm: () => {} });

const handleDeleteUser = (userId: string, userName: string) => {
  setConfirmDialog({
    open: true,
    title: 'Delete User',
    description: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
    onConfirm: async () => {
      // ... delete logic
    },
  });
};

const handleRoleChange = (userId: string, newRole: string, currentRole: string) => {
  if (newRole === currentRole) return;

  const isDowngrade = ['super_admin', 'organizer'].indexOf(currentRole) > ['super_admin', 'organizer'].indexOf(newRole);

  if (isDowngrade) {
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      description: `Change role from "${currentRole}" to "${newRole}"?`,
      onConfirm: async () => {
        // ... role change logic
      },
    });
    return;
  }

  // No confirmation for upgrades
  // ... proceed with role change
};
```

---

## Phase 2: Multi-Factor Authentication (Week 3-4) - P0

### Task 2.1: Add MFA Columns to Users Table

**File:** `drizzle/migrations/XXXX_add_user_mfa.sql`

```sql
-- Add MFA columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS recovery_codes TEXT[];

-- Index for MFA-enabled users
CREATE INDEX idx_users_mfa_enabled ON users(totp_enabled) WHERE totp_enabled = TRUE;
```

### Task 2.2: Create TOTP Utilities

**File:** `lib/mfa/totp.ts`

```typescript
import 'server-only';
import { authenticator } from 'otplib';
import crypto from 'crypto';

// Generate a new TOTP secret for a user
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

// Generate a TOTP URI for QR code
export function generateTOTPUri(email: string, secret: string): string {
  return authenticator.keyuri(email, 'Galeria Admin', secret);
}

// Verify a TOTP code
export function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.verify({
    token,
    secret,
    window: 2, // Allow 2 time steps (approx 1 minute) clock skew
  });
}

// Generate recovery codes
export function generateRecoveryCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

// Hash recovery code for storage
export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Verify recovery code
export function verifyRecoveryCode(
  code: string,
  hashedCodes: string[]
): boolean {
  const hashed = hashRecoveryCode(code);
  return hashedCodes.includes(hashed);
}

// Remove used recovery code
export function removeRecoveryCode(
  code: string,
  hashedCodes: string[]
): string[] {
  const hashed = hashRecoveryCode(code);
  return hashedCodes.filter(c => c !== hashed);
}
```

### Task 2.3: Create MFA Setup API

**File:** `app/api/admin/mfa/setup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';
import { generateTOTPSecret, generateTOTPUri, generateRecoveryCodes, hashRecoveryCode } from '@/lib/mfa/totp';

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const db = getTenantDb(auth.user.tenant_id);

  // Check if already enabled
  if (auth.user.totp_enabled) {
    return NextResponse.json(
      { error: 'MFA already enabled', code: 'MFA_ALREADY_ENABLED' },
      { status: 400 }
    );
  }

  // Generate secret and codes
  const secret = generateTOTPSecret();
  const recoveryCodes = generateRecoveryCodes();
  const hashedCodes = recoveryCodes.map(hashRecoveryCode);
  const uri = generateTOTPUri(auth.user.email, secret);

  // Store temporarily (not verified yet)
  await db.query(
    `UPDATE users
     SET totp_secret = $1, recovery_codes = $2
     WHERE id = $3`,
    [secret, JSON.stringify(hashedCodes), auth.user.id]
  );

  return NextResponse.json({
    data: {
      secret,
      uri,
      recoveryCodes, // Show only once!
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { token } = await request.json();

  if (!token) {
    return NextResponse.json(
      { error: 'Token required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const db = getTenantDb(auth.user.tenant_id);

  // Get user's secret
  const user = await db.findOne(
    'users',
    { id: auth.user.id }
  );

  if (!user?.totp_secret) {
    return NextResponse.json(
      { error: 'MFA not set up', code: 'MFA_NOT_SETUP' },
      { status: 400 }
    );
  }

  // Verify token
  const { verifyTOTP } = await import('@/lib/mfa/totp');
  if (!verifyTOTP(token, user.totp_secret)) {
    return NextResponse.json(
      { error: 'Invalid token', code: 'INVALID_TOKEN' },
      { status: 400 }
    );
  }

  // Enable MFA
  await db.query(
    `UPDATE users
     SET totp_enabled = TRUE, totp_verified_at = NOW()
     WHERE id = $1`,
    [auth.user.id]
  );

  return NextResponse.json({ success: true });
}
```

### Task 2.4: Update Admin Login to Require TOTP

**File:** `app/api/auth/login/route.ts`

```typescript
// Add TOTP verification to login flow
// After password validation, check if MFA is enabled

const user = await db.findOne('users', { email: email.toLowerCase() });

if (!user) {
  throw new Error('Invalid credentials');
}

const isValid = await comparePassword(password, user.password_hash);
if (!isValid) {
  throw new Error('Invalid credentials');
}

// NEW: Check if MFA is enabled
if (user.totp_enabled) {
  const { totp_token } = body;

  if (!totp_token) {
    return NextResponse.json({
      error: 'MFA token required',
      code: 'MFA_REQUIRED',
    }, { status: 401 });
  }

  const { verifyTOTP } = await import('@/lib/mfa/totp');
  if (!verifyTOTP(totp_token, user.totp_secret)) {
    return NextResponse.json({
      error: 'Invalid MFA token',
      code: 'INVALID_MFA_TOKEN',
    }, { status: 401 });
  }
}

// ... continue with session creation
```

---

## Phase 3: Tenant Management (Week 5) - P1

### Task 3.1: Create Tenant List API

**File:** `app/api/admin/tenants/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const status = searchParams.get('status'); // active, suspended, all

  const offset = (page - 1) * limit;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  const tenantsResult = await db.query(
    `SELECT
      t.id,
      t.company_name,
      t.slug,
      t.subscription_tier,
      t.status,
      t.created_at,
      COUNT(DISTINCT e.id) as event_count,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT p.id) as photo_count
    FROM tenants t
    LEFT JOIN events e ON e.tenant_id = t.id
    LEFT JOIN users u ON u.tenant_id = t.id
    LEFT JOIN photos p ON p.tenant_id = t.id
    WHERE ${whereClause}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM tenants t WHERE ${whereClause}`,
    params
  );

  const total = Number(countResult.rows[0]?.count || 0);

  return NextResponse.json({
    data: tenantsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { company_name, slug, subscription_tier = 'free' } = body;

  if (!company_name || !slug) {
    return NextResponse.json(
      { error: 'company_name and slug required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Check if slug exists
  const existing = await db.findOne('tenants', { slug });
  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists', code: 'SLUG_EXISTS' },
      { status: 409 }
    );
  }

  const tenant = await db.insert('tenants', {
    id: crypto.randomUUID(),
    company_name,
    slug,
    subscription_tier,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  return NextResponse.json({ data: tenant }, { status: 201 });
}
```

### Task 3.2: Create Tenant Detail API

**File:** `app/api/admin/tenants/[tenantId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { tenantId } = await params;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  const tenant = await db.query(
    `SELECT
      t.*,
      COUNT(DISTINCT e.id) as event_count,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT p.id) as photo_count,
      SUM(pg_total_relation_size(p.tableoid::regclass)) as storage_bytes
    FROM tenants t
    LEFT JOIN events e ON e.tenant_id = t.id
    LEFT JOIN users u ON u.tenant_id = t.id
    LEFT JOIN photos p ON p.tenant_id = t.id
    WHERE t.id = $1
    GROUP BY t.id`,
    [tenantId]
  );

  if (!tenant.rows[0]) {
    return NextResponse.json(
      { error: 'Tenant not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: tenant.rows[0] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { tenantId } = await params;
  const body = await request.json();
  const { subscription_tier, status } = body;

  const db = getTenantDb(SYSTEM_TENANT_ID);

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (subscription_tier !== undefined) {
    updates.push(`subscription_tier = $${paramIndex++}`);
    values.push(subscription_tier);
  }

  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: 'No changes provided', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  updates.push('updated_at = NOW()');
  values.push(tenantId);

  await db.query(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { tenantId } = await params;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Prevent deleting system tenant
  if (tenantId === SYSTEM_TENANT_ID) {
    return NextResponse.json(
      { error: 'Cannot delete system tenant', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

  return NextResponse.json({ success: true });
}
```

### Task 3.3: Create Tenant Management UI

**File:** `app/admin/tenants/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Calendar, Image, Shield, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  company_name: string;
  slug: string;
  subscription_tier: string;
  status: 'active' | 'suspended';
  created_at: string;
  event_count: number;
  user_count: number;
  photo_count: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTenants();
  }, [currentPage, statusFilter]);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/tenants?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Tenant status updated');
        fetchTenants();
      } else {
        toast.error('Failed to update tenant');
      }
    } catch (error) {
      toast.error('Failed to update tenant');
    }
  };

  // ... rest of the component
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tenant Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage all platform tenants
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Tenants Table */}
      {/* ... implement table with tenant data */}
    </div>
  );
}
```

---

## Phase 4: Session Management (Week 6) - P1

### Task 4.1: Create Session List API

**File:** `app/api/admin/sessions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Get all active sessions
  const sessions = await db.query(
    `SELECT
      s.session_id,
      s.user_id,
      s.created_at,
      s.last_activity,
      s.expires_at,
      s.ip_address,
      s.user_agent,
      u.name as user_name,
      u.email as user_email,
      u.role as user_role
    FROM sessions s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.expires_at > NOW()
    ORDER BY s.last_activity DESC`
  );

  return NextResponse.json({ data: sessions.rows });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');
  const all = searchParams.get('all') === 'true';

  const db = getTenantDb(SYSTEM_TENANT_ID);

  if (all) {
    // Revoke all sessions except current
    await db.query(
      `DELETE FROM sessions
       WHERE session_id != $1`,
      [auth.sessionId]
    );
  } else if (userId) {
    // Revoke all sessions for user
    await db.query(
      `DELETE FROM sessions WHERE user_id = $1`,
      [userId]
    );
  } else if (sessionId) {
    // Revoke specific session
    await db.query(
      `DELETE FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
  } else {
    return NextResponse.json(
      { error: 'Specify userId, sessionId, or all=true', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
```

---

## Quick Reference: File Changes Summary

### Phase 1 (Security) - 6 files
1. `drizzle/migrations/XXXX_add_admin_audit_logs.sql` - NEW
2. `lib/audit/index.ts` - NEW
3. `lib/audit/middleware.ts` - NEW
4. `app/api/admin/users/[userId]/route.ts` - MODIFY
5. `app/api/admin/users/route.ts` - MODIFY
6. `components/admin/ConfirmDialog.tsx` - NEW

### Phase 2 (MFA) - 5 files
1. `drizzle/migrations/XXXX_add_user_mfa.sql` - NEW
2. `lib/mfa/totp.ts` - NEW
3. `app/api/admin/mfa/setup/route.ts` - NEW
4. `app/api/admin/mfa/verify/route.ts` - NEW
5. `app/api/auth/login/route.ts` - MODIFY

### Phase 3 (Tenants) - 2 files
1. `app/api/admin/tenants/route.ts` - NEW
2. `app/api/admin/tenants/[tenantId]/route.ts` - NEW
3. `app/admin/tenants/page.tsx` - NEW

### Phase 4 (Sessions) - 2 files
1. `app/api/admin/sessions/route.ts` - NEW
2. `app/admin/sessions/page.tsx` - NEW

---

## Testing Checklist

After each phase, verify:

### Phase 1 Testing
- [ ] Audit logs created for all admin actions
- [ ] Self-role demotion blocked
- [ ] Search works correctly (fixes parameter bug)
- [ ] Confirmation dialogs appear for critical actions

### Phase 2 Testing
- [ ] MFA setup generates QR code and recovery codes
- [ ] TOTP verification works
- [ ] Recovery codes work
- [ ] Login requires MFA when enabled
- [ ] MFA can be disabled

### Phase 3 Testing
- [ ] Tenant list loads correctly
- [ ] Tenant creation works
- [ ] Tenant suspension works
- [ ] Tenant details page shows correct stats

### Phase 4 Testing
- [ ] Session list shows all active sessions
- [ ] Individual session revocation works
- [ ] User session revocation works
- [ ] Global session revocation works

---

*Implementation Plan v1.0 - 2026-03-19*
