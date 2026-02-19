# Feature-Dev System
Optional extension for structured feature planning, implementation, testing, and review.

## Purpose
Feature-Dev helps Rover and Hazrin run repeatable development cycles with explicit scope, verification, and documentation.

## Activation
- `load feature-dev`
- `start dev mode`

## Core Workflow
1. Analyze request and define success criteria.
2. Break work into tasks with dependencies.
3. Implement incrementally.
4. Validate with tests/checks.
5. Summarize outcomes and follow-ups.

## Commands
### Feature Lifecycle
- `new feature [name]`
- `resume feature`
- `feature status`
- `complete feature`

### Development Support
- `analyze [request]`
- `break down [feature]`
- `implement [task]`
- `next task`

### Validation and Quality
- `run tests`
- `test [component]`
- `review code`
- `check security`
- `check performance`
- `lint code`

### Documentation
- `document [code]`
- `update readme`
- `create api docs`

## Storage Layout
```text
.memorycore/Feature/Feature-Dev-System/
  feature-dev-core.md
  README.md
  QUICK-REFERENCE.md
  install-feature-dev.md
  development-standards-template.md
  development-standards.md
  current-feature-template.md
  active-development/
    current-feature.md
  completed-features/
    [feature archives]
```

## Repository Grounding Rules
- Treat `package.json` as the source of truth for runnable commands.
- Keep architecture references aligned to current repo reality:
  - Next.js + TypeScript
  - Drizzle/PostgreSQL tenant model
  - Redis support
  - R2/S3 upload pipeline
  - Supabase realtime client integration
  - Moderation pipeline via Rekognition + BullMQ
- Keep drift notes explicit if docs and runtime differ.

## Collaboration Guardrails
- Feature-Dev is a protocol for guided execution, not blind automation.
- High-impact decisions still require clear confirmation.
- Existing core command contract remains unchanged (`Rover`, `save`, `update memory`, `review growth`).

## Related Modules
- Compatible with LRU Project Management for multi-workstream tracking.
- Compatible with Time-based Aware System for session pacing.
- Compatible with Code-Size-Guardian for ongoing file-size health checks during development.
