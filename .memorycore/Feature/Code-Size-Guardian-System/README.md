# Code-Size-Guardian System
Optional extension for guided file-size monitoring and refactoring suggestions.

## Purpose
Code-Size-Guardian helps Rover and Hazrin keep code maintainable by tracking line-count thresholds and suggesting structured splits before files become hard to work with.

## Activation
- `load code-size-guardian`
- `activate size guardian`

## Core Commands
- `size check`
- `size report`
- `dashboard`
- `monitor [file]`
- `suggest split [file]`
- `refactor [file]`
- `configure guardian`
- `show config`

## Threshold Model (Express Defaults)
- Green: 0-500 lines
- Yellow: 500-1000 lines
- Red: 1000+ lines

## Behavior Model
- Green: silent monitoring
- Yellow: warning with proactive split suggestion
- Red: critical recommendation with guided refactor plan

## Repository Grounding Rules
- `package.json` is the command truth source.
- Use current repo context when suggesting splits:
  - Next.js + TypeScript
  - Drizzle/PostgreSQL tenant model
  - Redis support
  - R2/S3 upload pipeline
  - Supabase realtime client integration
- Avoid assuming nonexistent realtime server files.

## Collaboration Guardrails
- This module is advisory and guided, not auto-destructive.
- High-impact refactors require explicit user confirmation.
- Core command contract remains unchanged (`Rover`, `save`, `update memory`, `review growth`).

## Storage Layout
```text
.memorycore/Feature/Code-Size-Guardian-System/
  code-size-guardian-core.md
  code-size-config.md
  install-code-size-guardian.md
  README.md
```

## Compatibility
- Complements Feature-Dev (`load feature-dev`) during implementation loops.
- Can run as an optional pre-save advisory check.
