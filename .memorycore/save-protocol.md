#  Save Protocol - Permanent Memory Updates
*Triggered when Hazrin types "save"*

## Core Philosophy
When Hazrin types `save`, Rover should preserve session-critical learning in the memory files without changing project code.

## Trigger Behavior
On `save`, Rover immediately:
1. Updates `main/current-session.md`
2. Updates `main/relationship-memory.md`
3. Updates `main/critical-thinking.md` only for reusable reasoning gains
4. Updates diary entry when session is significant
5. Confirms what was saved

## What Gets Saved
- Current task status and open follow-ups
- Communication preferences and execution style updates
- Reusable architecture/testing/debug patterns
- Priority movement tied to actual repo goals

## Feature-Dev Distinction
- Global `save` updates core memory files and diary continuity.
- Feature-Dev working state is tracked in:
  - `Feature/Feature-Dev-System/active-development/current-feature.md`
  - `Feature/Feature-Dev-System/completed-features/`
- If both are relevant, keep global memory and feature-state summaries consistent.

## Code-Size-Guardian Distinction
- Code-Size-Guardian can provide optional pre-save file-size advisories.
- Default behavior is non-blocking guidance.
- Advisory info should not prevent core memory persistence unless explicitly requested by Hazrin.

## Update Rules by File

### `main/current-session.md`
- Keep a concise snapshot of active repository work
- Track immediate priorities and blockers
- Preserve restart continuity

### `main/relationship-memory.md`
- Capture stable preference signals from Hazrin
- Keep only behaviorally useful patterns

### `main/critical-thinking.md`
- Store reusable engineering heuristics only
- Prefer Next.js/TypeScript/API/schema/testing patterns

### `daily-diary/Daily-Diary-001.md`
- Record meaningful milestones and decisions
- Keep entries factual and repo-grounded

## Quality Gates
Every save should be:
- **Accurate**: grounded in observed session facts
- **Useful**: changes future behavior
- **Concise**: avoids noise and repetition
- **Consistent**: command contract unchanged (`Rover/save/update memory/review growth`)

## Context Integrity Rules
- Validate command references against `package.json`
- Flag docs drift when encountered (for example `dev:all` mismatch)
- Prefer realtime truth from code (`lib/realtime/client.tsx`) over stale docs claims

## Save Completion Message Template

```text
Saved:
- Session context: main/current-session.md
- Relationship updates: main/relationship-memory.md
- Reasoning updates: main/critical-thinking.md
- Diary updates: daily-diary/Daily-Diary-001.md (if applicable)
- Feature-Dev state: Feature/Feature-Dev-System/active-development/current-feature.md (if applicable)
- Guardian advisory: Feature/Code-Size-Guardian-System (if used)
```
