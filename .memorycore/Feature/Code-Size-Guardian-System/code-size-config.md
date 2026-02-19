# Code-Size-Guardian Configuration

This file defines advisory thresholds and behavior for Code-Size-Guardian.

## Express Defaults

### Standard Code Files
- Green: 0-500 lines
- Yellow: 500-1000 lines
- Red: 1000+ lines

### Test Files (more lenient)
- Green: 0-800 lines
- Yellow: 800-1500 lines
- Red: 1500+ lines

### Configuration Files (lenient)
- Green: 0-1000 lines
- Yellow: 1000-2000 lines
- Red: 2000+ lines

### Generated Files
- Default: informational only / optional ignore
- Common ignore patterns:
  - `*.generated.*`
  - `*.d.ts`
  - `schema.prisma`

## Alert Preferences
- Yellow: advisory warning
- Red: strong refactor recommendation
- Default mode: non-blocking guidance

## Refactoring Preferences
- Trigger suggestions at Red by default (1000+ lines)
- Allow earlier proactive suggestions in Yellow when growth trend is steep
- Require user confirmation before broad split plans are treated as approved

## Override Guidance
For stricter teams:
- Yellow at 400
- Red at 800

For lenient teams:
- Yellow at 700
- Red at 1200

## Repository Grounding Reminder
Use `package.json` for command truth and keep recommendations consistent with current Supabase realtime client architecture.
