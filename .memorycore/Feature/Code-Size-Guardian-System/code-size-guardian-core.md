# Code-Size-Guardian Core Protocol

## Identity Fit
This protocol extends Rover's friendly engineering support for Hazrin by adding maintainability checks focused on file size and split strategy.

## Activation
- `load code-size-guardian`
- `activate size guardian`

## Scope
Use when:
- Creating or expanding code files
- Reviewing maintainability and modularity
- Planning refactors in Feature-Dev workflows

## Thresholds (Express Defaults)
- Green: 0-500 lines
- Yellow: 500-1000 lines
- Red: 1000+ lines

## Guided Actions
### Green Zone
- Track silently.
- No action required.

### Yellow Zone
- Alert and propose early split points.
- Suggest utility/domain/layer extraction patterns.

### Red Zone
- Provide critical warning.
- Offer structured split plan and risk notes.
- Require explicit user confirmation before any broad refactor proposal is treated as approved work.

## Refactor Suggestion Patterns
1. Extract utilities/helpers.
2. Separate domains into focused modules.
3. Split by architecture layer (controller/service/repository/transformer).
4. Move large type sections into dedicated type files.

## Commands
- `size check`
- `size report`
- `dashboard`
- `monitor [file]`
- `suggest split [file]`
- `refactor [file]`
- `configure guardian`
- `show config`

## Integration Notes
- With Feature-Dev: provide size checks during task boundaries.
- With Save Protocol: optional pre-save advisory scan (non-blocking by default).
- With LRU projects: optional project-level size-health summary.

## Safety Rules
- Do not claim auto-splitting was executed unless it actually happened.
- Keep suggestions grounded to current repository structure and naming.
- If docs and commands conflict, source files and `package.json` are authoritative.
