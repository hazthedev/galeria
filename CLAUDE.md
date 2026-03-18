# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
```

**Pool Configuration**: Database pool settings differ between environments:
- Production (Vercel/serverless): `DATABASE_POOL_MIN=0`, `DATABASE_POOL_MAX=1`
- Local development: `DATABASE_POOL_MIN=2`, `DATABASE_POOL_MAX=20`
- Configure via env vars to override defaults

### Server-Only Package Separation

This project explicitly uses **webpack** (not turbopack) to properly externalize server-only packages. The build config in `next.config.ts`:
- Blocks server-only packages on client via `config.resolve.alias` and `config.resolve.fallback`
- Marks Node.js-native packages as externals for server build
- Uses `output: 'standalone'` for production builds

**Critical**: Never import server-only packages in client components. Files using `server-only` include:
- `@/lib/moderation/init.ts`
- `@/jobs/scan-content.ts`
- Any file importing `pg`, `bullmq`, `ioredis`, `bcrypt`, `@aws-sdk/*`

**Pattern**: Files that must only run on server should import `server-only` at the top:
```typescript
import 'server-only';
```

### Content Moderation System

AI moderation runs via BullMQ job queue initialized in `instrumentation.ts`:
- Enabled via `MODERATION_QUEUE_ENABLED=true` env var
- Uses AWS Rekognition for image scanning
- Photos are quarantined if rejected
- Queue worker runs with concurrency of 3

### Layer Organization

```
lib/
├── domain/           # Business logic (auth, events, tenant, content)
├── infrastructure/   # External services (database, cache, storage)
├── api/              # API middleware and context
├── services/         # High-level service functions
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
- `resolveOptionalAuth()` from `@/lib/api-request-context` for unified auth resolution

### Supabase Integration
The app has optional Supabase integration that acts as a fallback to direct PostgreSQL:
- Used when database connection pool is exhausted (MaxClientsInSessionMode errors)
- Configured via `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Automatically provisions app users via Supabase Auth when needed

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
- `MODERATION_QUEUE_ENABLED` - Enable background moderation worker
- `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - For Rekognition

## Testing Notes

- Jest config in `jest.config.cjs`
- Test files: `**/*.test.ts` or `**/*.test.tsx`
- Use `@/` path alias for imports
- Test environment: Node (not jsdom)
