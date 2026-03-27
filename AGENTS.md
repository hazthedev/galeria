# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js App Router UI, layouts, and API handlers such as `app/api/**/route.ts`. Put reusable UI in `components/`, grouped by feature (`gallery/`, `lucky-draw/`, `settings/`). Keep business logic, infrastructure adapters, and shared helpers in `lib/`, especially `lib/domain`, `lib/infrastructure`, `lib/api`, and `lib/services`. Database schema and SQL migrations live in `drizzle/`, operational scripts live in `scripts/`, shared types live in `types/`, and static assets live in `public/` and `icon/`.

## Build, Test, and Development Commands
Use `npm run dev` to start the local webpack-based Next.js server. Build with `npm run build`, then serve it with `npm run start`.

Quality checks:
- `npm run lint` runs ESLint with Next.js, TypeScript, and security rules.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm test` runs Jest.
- `npm run test:coverage` generates coverage output.

Database helpers:
- `npm run db:migrate` applies SQL migrations from `drizzle/migrations/`.
- `npm run db:seed` seeds development data.
- `npm run db:reset` resets the local database.
- `npm run db:health` verifies database connectivity.

## Coding Style & Naming Conventions
Write TypeScript with strict typing and use the `@/` path alias for cross-folder imports. Follow the existing 2-space indentation and keep files focused. Use PascalCase for React component filenames (`LuckyDrawAdminTab.tsx`), `use*` for hooks, and kebab-case for utility modules (`rate-limit.ts`, `tier-config.ts`). Next.js convention files should keep framework names such as `page.tsx`, `layout.tsx`, and `route.ts`.

## Testing Guidelines
Jest is configured with a Node test environment and picks up `*.test.ts` and `*.test.tsx`. Place tests beside the code they cover, as seen in `lib/**`. There is no enforced coverage threshold, but new logic in `lib/`, middleware, and API routes should ship with tests. For CI parity, prefer `npm test -- --runInBand` before opening a PR.

## Commit & Pull Request Guidelines
Recent history follows short conventional prefixes like `feat:`, `fix:`, and `ui:` with imperative subjects. Keep each commit focused on one change. Pull requests should include a clear summary, linked issue or task, screenshots for UI changes, and the commands you ran locally (`npm run lint`, `npm run typecheck`, `npm test`). Call out migration, auth, or environment changes explicitly.

## Security & Configuration Tips
Start from `.env.example` and never commit real secrets. This app mixes client and server code, so keep server-only dependencies (`pg`, `ioredis`, AWS SDK, `bcrypt`) out of client components and route them through server modules in `lib/` or `app/api/`.
