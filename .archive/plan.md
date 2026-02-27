# Least-Privilege Implementation Plan

## Overview
Implement proper access controls following the principle of least privilege by default.

## Current Issues
- New users are created as `admin` by default (security risk)
- Organizers can see all events instead of just their own
- No role hierarchy enforcement
- No audit logging for sensitive actions

## Implementation Plan

### Phase 1: Role-Based Access Control (RBAC)

#### 1.1 Update Default Role for New Users
**File:** `prj/app/api/auth/register/route.ts`
- Change default role from `admin` to `organizer`
- First user of a tenant becomes `admin` automatically
- Subsequent users require explicit role upgrade

#### 1.2 Role Hierarchy
```
super_admin  >  admin  >  organizer  >  guest
```
- `super_admin`: Cross-tenant access, manage all tenants
- `admin`: Full access within their tenant
- `organizer`: Create and manage only their own events
- `guest`: View-only access to events they're invited to

#### 1.3 Update Event Queries
**File:** `prj/app/api/events/route.ts`
- Add `organizer_id` filter for organizers
- Admins see all events in tenant
- Organizers see only their events

### Phase 2: Short Code & URL Management

#### 2.1 Short Code is Immutable
- Short codes are generated once and never change
- Provides stable shareable links
- Can be manually updated by admin only (deliberate action)

#### 2.2 URL Strategy
- **Guest sharing**: Always use short link `/e/{short_code}`
- **Admin URLs**: Use `/events/{id}` for management
- **QR codes**: Encode the short link only

### Phase 3: Admin Actions & Audit Log

#### 3.1 Role Upgrade Flow
Add endpoint to upgrade user roles:
```
POST /api/admin/users/:userId/role
```
Only `admin` or `super_admin` can call this.

#### 3.2 Audit Logging
Create audit log table:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'role_change', 'event_delete', etc.
  target_type TEXT, -- 'user', 'event'
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Log sensitive actions:
- Role changes
- Event deletion
- Permission grants

### Phase 4: API Endpoint Protection

#### 4.1 Update All Endpoints
Add role checks to all sensitive endpoints:

```typescript
// Helper function
function requireRole(userRole: string, allowedRoles: string[]): boolean {
  const roleHierarchy = ['guest', 'organizer', 'admin', 'super_admin'];
  const roleIndex = roleHierarchy.indexOf(userRole);
  return allowedRoles.some(role => roleHierarchy.indexOf(role) <= roleIndex);
}

// Usage
if (!requireRole(userRole, ['admin'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### 4.2 Event-Specific Permissions
- **View**: Any authenticated user (tenant scoped)
- **Edit**: Event organizer or admin
- **Delete**: Event organizer or admin
- **Moderate photos**: Event organizer or admin

### Phase 5: Tenant Owner Management

#### 5.1 First User Admin Rule
```typescript
// In registration/tenant creation
const existingUsers = await db.count('users', { tenant_id });
const role = existingUsers === 0 ? 'admin' : 'organizer';
```

#### 5.2 Invite System (Future)
- Generate invite codes for new users
- Specify role on invite
- Track who invited whom

## Implementation Order

1. **Quick Win** (Do Now):
   - Update guest page to only show short link ✓ (Done)
   - Update admin QR tab to only show short link ✓ (Done)

2. **High Priority**:
   - Change default role from `admin` to `organizer`
   - Add first-user-admin rule
   - Add organizer_id filter to event queries

3. **Medium Priority**:
   - Add audit logging table and functions
   - Create role upgrade endpoint
   - Update all endpoints with proper role checks

4. **Future**:
   - Invite system with role specification
   - Admin dashboard for user management
   - Audit log viewer

## Database Migration Needed

```sql
-- Update existing users to organizer (except first per tenant)
WITH ranked_users AS (
  SELECT id, tenant_id, role,
         ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) as rn
  FROM users
)
UPDATE users
SET role = 'organizer'
WHERE role = 'admin'
  AND id IN (SELECT id FROM ranked_users WHERE rn > 1);
```

## Testing Checklist

- [ ] New user registers → becomes `organizer`
- [ ] First user of tenant → becomes `admin`
- [ ] Organizer creates event → sees only their events
- [ ] Admin views events → sees all tenant events
- [ ] Organizer tries to view another's event → forbidden
- [ ] Admin upgrades organizer to admin → success
- [ ] Organizer tries to upgrade role → forbidden
- [ ] Short link works for all events
- [ ] QR code encodes short link only
