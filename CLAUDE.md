# CLAUDE.md

Guidance for AI coding assistants working in this repository.

## Rules

- Read existing files before writing code.
- Prefer targeted edits over full rewrites.
- No over-engineering, no speculative features.
- No sycophantic openers or closing fluff.
- Verify work before declaring done. If cause is unclear, say so.
- User instructions always override this file.

## Project

Galeria is a multi-tenant event photo gallery SaaS — Next.js 16 + PostgreSQL + Redis + Cloudflare R2.

**Core features:** Event photo galleries, manual moderation, lucky draw, attendance tracking, photo challenges, subscription tiers.

> AI auto-moderation (AWS Rekognition) has been removed. The system is manual-only.

## Commands

```bash
# Dev
npm run dev          # Start dev server (webpack, not turbopack)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint

# Database
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed dev data
npm run db:studio    # Drizzle Studio GUI
npm run db:health    # Check DB connection
npm run db:reset     # Reset and reseed

# Test
npm test             # Run all Jest tests
npm run test:watch   # Watch mode
```

> Always use `--webpack`. Turbopack is not supported due to complex server-only package handling.

## Architecture

### Multi-Tenant

All DB queries must use `getTenantDb(tenantId)`, which sets the PostgreSQL tenant context via RLS.

```typescript
import { getTenantDb } from '@/lib/db';
const db = getTenantDb(tenantId);
await db.findOne('users', { id: userId });
await db.transact(async (client) => { ... });
```

Special tenant IDs (in `lib/constants/tenants.ts`):
- `SYSTEM_TENANT_ID` — system/audit operations
- `DEFAULT_TENANT_ID` — fallback in non-production

### Server-Only Packages

Never import `pg`, `ioredis`, `bcrypt`, or `@aws-sdk/*` in client components. Server-only files must begin with:
```typescript
import 'server-only';
```

### Auth

- Dual auth: JWT (access + refresh) **and** Redis session (cookie or `x-session-id` header).
- `requireAuthForApi()` — require auth in API routes.
- `resolveOptionalAuth()` — resolve auth without requiring it.
- Super admins use TOTP-based MFA (`lib/mfa/totp.ts`).

### Photo Moderation

Statuses: `pending` → `approved` / `rejected`.
Controlled by the `moderation_required` event feature flag. Logged to `photo_moderation_logs`.

### Event Permissions

Event `PATCH` / `DELETE` is allowed for **any user belonging to the event's `tenant_id`**, not just the original creator. This supports co-admin / multi-user workspaces.

### Lucky Draw Idempotency

Draw execution is wrapped in a **Redis distributed mutex** (`lib/infrastructure/lock/mutex.ts`, `SET NX EX`). Concurrent draw requests return `409 Conflict`. TTL is 30 s — monitor logs for `LockConflictError` if draws take longer.

### Layer Structure

```
lib/
├── domain/         # Business logic (auth, events, tenant)
├── infrastructure/ # DB, cache, storage clients
├── api/            # Middleware and request context
├── services/       # High-level service functions
├── audit/          # Admin audit logging
├── mfa/            # TOTP 2FA
├── realtime/       # Supabase realtime broadcast
└── export/         # Zip / data export
```

## Key Environment Variables

```
DATABASE_URL                    # PostgreSQL
REDIS_URL                       # Redis
R2_PUBLIC_URL                   # Cloudflare R2 image CDN
JWT_ACCESS_SECRET               # JWT signing
NEXT_PUBLIC_SUPABASE_URL        # Supabase (realtime + fallback DB)
SUPABASE_SERVICE_ROLE_KEY
MODERATION_QUEUE_ENABLED        # Enable manual moderation queue
```

See `.env.example` for full list.
