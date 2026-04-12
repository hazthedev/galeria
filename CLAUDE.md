# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Response Rules

- Think before acting. Read existing files before writing code.
- Be concise. Code first, explanation only if non-obvious.
- No sycophantic openers ("Sure!", "Great question!") or closing fluff ("Hope this helps!").
- No restating the question. No unsolicited suggestions beyond scope.
- Prefer targeted edits over rewriting whole files.
- Do not re-read files already read unless they may have changed.
- Keep solutions simple. No over-engineering, no speculative features.
- Three similar lines beat a premature abstraction.
- No docstrings, comments, or type annotations on unchanged code.
- No error handling for impossible scenarios.
- Verify your work before declaring done.
- State bugs directly. Show the fix. Stop.
- If cause is unclear, say so. Do not guess.
- User instructions always override this file.

## Project Overview

Galeria is a multi-tenant event photo gallery platform built with Next.js 16, PostgreSQL, and Redis. Key features include:
- Event photo galleries with guest uploads
- Lucky draw system with prize tiers
- Photo challenge system
- Attendance tracking with QR codes
- AI-powered content moderation (AWS Rekognition)
- Multi-tenant SaaS architecture with subscription tiers

## Development Commands

### Core Development
```bash
npm run dev          # Start dev server (uses webpack, not turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Database
```bash
npm run db:setup         # Run migrations (alias for db:migrate)
npm run db:migrate       # Apply pending migrations
npm run db:rollback      # Rollback last migration
npm run db:seed          # Seed development data
npm run db:seed:test     # Seed test data
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate Drizzle migrations (not used - custom migrations)
npm run db:push          # Push schema changes (development only)
npm run db:health        # Check database connection
npm run db:backup        # Backup database
npm run db:restore       # Restore database
npm run db:reset         # Reset and reseed database
```

### Testing
```bash
npm test                         # Run Jest tests
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report
npm test -- path/to/test.test.ts  # Run a single test file
```

### Security
```bash
npm run security          # Run all security scans (audit + snyk)
npm run security:audit    # NPM audit
npm run security:snyk     # Snyk scan
npm run security:semgrep  # Semgrep static analysis
npm run security:scan     # Run all three (audit + snyk + semgrep)
npm run security:fix      # Fix security issues
```

## Architecture

### Multi-Tenant Database Pattern

The app uses PostgreSQL Row-Level Security (RLS) for tenant isolation. Key concepts:

1. **Tenant Context**: All database queries must call `set_tenant_id($1)` before execution
2. **TenantDatabase Class**: Use `getTenantDb(tenantId)` to get a tenant-aware DB instance
3. **Connection Pooling**: In production, connections are destroyed on release to avoid session-mode pool exhaustion in serverless

```typescript
import { getTenantDb } from '@/lib/db';

const db = getTenantDb(tenantId);
const user = await db.findOne('users', { id: userId });
// For multi-statement transactions:
await db.transact(async (client) => { ... });
```

**Special Tenant IDs** (from `lib/constants/tenants.ts`):
- `SYSTEM_TENANT_ID` (`00000000-0000-0000-0000-000000000000`) - used for audit logs and system operations
- `DEFAULT_TENANT_ID` (`00000000-0000-0000-0000-000000000001`) - fallback tenant in non-production

**Pool Configuration**: Database pool settings differ between environments:
- Production (Vercel/serverless): `DATABASE_POOL_MIN=0`, `DATABASE_POOL_MAX=1`
- Local development: `DATABASE_POOL_MIN=2`, `DATABASE_POOL_MAX=20`
- Configure via env vars to override defaults
- Retry env vars: `DB_RETRY_MAX_ATTEMPTS`, `DB_RETRY_BASE_DELAY_MS`

### Server-Only Package Separation

This project explicitly uses **webpack** (not turbopack) to properly externalize server-only packages. The build config in `next.config.ts`:
- Blocks server-only packages on client via `config.resolve.alias` and `config.resolve.fallback`
- Marks Node.js-native packages as externals for server build
- Uses `output: 'standalone'` for production builds

**Critical**: Never import server-only packages in client components. Files using `server-only` include:
- Any file importing `pg`, `ioredis`, `bcrypt`, `@aws-sdk/*`

**Pattern**: Files that must only run on server should import `server-only` at the top:
```typescript
import 'server-only';
```

### Content Moderation System

Manual photo moderation is available per-event via the `moderation_required` feature flag:
- When enabled, uploaded photos start with `status='pending'` and must be manually approved/rejected by organizers
- Approve/reject actions are logged in `photo_moderation_logs` table
- Moderation service in `lib/moderation/service.ts` handles approval/rejection logic
- AI auto-moderation (AWS Rekognition) has been removed

### Layer Organization

```
lib/
├── domain/           # Business logic (auth, events, tenant, content)
├── infrastructure/   # External services (database, cache, storage)
├── api/              # API middleware and context
├── services/         # High-level service functions
├── audit/            # Admin action audit logging
├── mfa/              # TOTP-based 2FA for super admins
├── realtime/         # Supabase realtime broadcast (server-side)
├── export/           # Event data export / zip generation
└── shared/           # Shared utilities
```

### Database Schema

Schema defined in `drizzle/schema.ts` using Drizzle ORM. Migrations are SQL files in `drizzle/migrations/` applied by custom migration runner in `scripts/migrate.ts`.

**Important**: Most database operations use the `TenantDatabase` class with raw SQL queries, not Drizzle ORM queries. This is by design for better control over tenant context and performance.

Key tables:
- `tenants` - Multi-tenant configuration with branding and features
- `users` - User accounts with RLS
- `events` - Event management with JSONB settings
- `photos` - Photo uploads with reactions and metadata
- `lucky_draw_configs` / `lucky_draw_entries` / `winners` - Lucky draw system
- `photo_challenges` / `guest_photo_progress` / `prize_claims` - Photo challenge system

### App Directory Structure

```
app/
├── api/                    # API routes
│   ├── admin/             # Admin endpoints
│   ├── auth/              # Authentication endpoints
│   ├── events/[eventId]/  # Event-specific endpoints
│   └── photos/[id]/       # Photo endpoints
├── organizer/             # Organizer dashboard (protected)
├── events/[eventId]/      # Guest event pages
├── auth/                  # Login/register pages
└── admin/                 # Super admin dashboard
```

## Important Conventions

### Authentication Flow
- Dual auth system: JWT-based auth (access + refresh tokens) **and** Redis session-based auth
- Session ID extracted from cookie or `x-session-id` header
- `requireAuthForApi()` helper for API routes (supports both JWT and session)
- Use `verifyAccessToken()` for JWT validation
- `resolveOptionalAuth()` from `@/lib/api/api-request-context` for unified auth resolution
- Super admins use TOTP-based MFA (`lib/mfa/totp.ts`) with RFC 6238 compliant codes and recovery codes

### API Request Context
`lib/api/api-request-context.ts` provides tenant/auth resolution helpers used across all API routes:
- `resolveOptionalAuth()` - resolves auth without requiring it
- `resolveTenantId()` - resolves tenant from subdomain/header, falls back to `DEFAULT_TENANT_ID` in dev
- `resolveRequiredTenantId()` - throws if tenant cannot be resolved

### Audit Logging
All admin actions are logged via `logAdminAction()` in `lib/audit/index.ts`. Audit logs are written to `SYSTEM_TENANT_ID`. Covers user management, tenant operations, moderation actions, MFA, and session management.

### Supabase Integration
The app has optional Supabase integration:
- **Fallback DB**: Used when PostgreSQL pool is exhausted (MaxClientsInSessionMode errors). Configured via `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- **Realtime**: Server-side broadcast via `lib/realtime/server.ts` — publishes events to channels like `event:${eventId}` for live gallery updates

### Event Short Codes
Events have both a `slug` (URL-friendly, per-tenant unique) and `short_code` (memorable like "party123", globally unique). Guest pages use short codes: `/e/[shortCode]`

### Photo Moderation Status
- `pending` - Awaiting moderation (or manual approval if auto-moderation disabled)
- `approved` - Visible in gallery
- `rejected` - Hidden, moved to quarantine

### Webpack vs Turbopack
Always use `--webpack` flag with dev/build commands. The project has complex server-only package handling that turbopack doesn't support yet.

### Production Deployment
The build outputs a `standalone` deployment (configured in `next.config.ts`). This creates a minimal `.next/standalone` folder with only necessary files for containerized deployment.

## Environment Variables

Key variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (for cache and queues)
- `R2_PUBLIC_URL` - Cloudflare R2 for image storage
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` - Auth tokens
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - Supabase fallback + realtime
- `SYSTEM_TENANT_ID` / `MASTER_TENANT_ID` - Override special tenant UUIDs
- `DB_RETRY_MAX_ATTEMPTS` / `DB_RETRY_BASE_DELAY_MS` - DB retry tuning

## Admin Scripts

Utility scripts in `scripts/` (run with `npx ts-node scripts/<name>.ts`):
- `create-superadmin.ts` / `reset-superadmin.ts` - Manage super admin account
- `apply-audit-migration.ts` - Apply audit log migration
- `find-events-by-email.ts` / `list-events.ts` - Lookup utilities
- `fix-migration-version.ts` - Repair migration version tracking

## Testing Notes

- Jest config in `jest.config.cjs`
- Test files: `**/*.test.ts` or `**/*.test.tsx`
- Use `@/` path alias for imports
- Test environment: Node (not jsdom)

## Guest Page UX Improvement Plan

See [GUEST_PAGE_UX_PLAN.md](./GUEST_PAGE_UX_PLAN.md) for the prioritized list of UI/UX improvements planned for the guest event page (`app/events/[eventId]/guest/`). Key items:
1. Add photo lightbox with swipe/zoom (critical)
2. Add "My Photos" tab/filter
3. Simplify header — move downloads into dropdown
4. Add drag-and-drop to upload modal
5. Add tap-to-love button on mobile
6. Stronger empty state
7. Extract components (PhotoCard, UploadModal, GalleryGrid, HeaderActions)
8. Use CSS variables at container level instead of inline styles
9. Add hero/banner section
