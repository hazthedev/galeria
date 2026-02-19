# Development Standards Template

Use this template to tailor Feature-Dev behavior per repository/team needs.

## Stack Defaults
- Primary language: TypeScript
- Framework: Next.js App Router
- Data layer: Drizzle + PostgreSQL
- Supporting infra: Redis, R2/S3, Supabase realtime

## Code Style
- Keep naming and structure consistent with existing files
- Prefer explicit types for public boundaries
- Keep functions focused and testable

## Testing Defaults
- Unit tests: Jest
- Priority additions:
  - Component tests for admin/organizer dashboard surfaces
  - API integration tests for critical routes
- Include edge-case coverage for error responses and permissions

## API and Error Handling
- Keep response formats consistent across routes
- Include useful logging for operational debugging
- Validate request payloads at route boundaries

## Security and Reliability
- Follow existing security scripts and checks in `package.json`
- Re-check auth/tenant boundaries on sensitive routes
- Prefer safe defaults over permissive behavior

## Documentation Drift Rule
If docs conflict with code:
1. Prefer source files and `package.json`
2. Record drift note in feature log
3. Avoid cementing outdated assumptions
