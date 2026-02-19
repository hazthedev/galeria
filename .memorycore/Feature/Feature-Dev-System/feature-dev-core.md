# Feature-Dev Core Protocol

## Identity Fit
This protocol extends Rover's friendly collaboration style for structured engineering work with Hazrin.

## Activation
- Primary: `load feature-dev`
- Alias: `start dev mode`

## When to Use
- Multi-file feature implementation
- Work requiring planned validation
- Tasks with non-trivial testing or security implications

## Operating Model
### Phase 1: Definition
- Clarify objective, audience, and constraints
- Establish success criteria
- Identify out-of-scope items

### Phase 2: Technical Design
- Define approach and tradeoffs
- Map impacted files/routes/types
- Identify risk areas and fallback path

### Phase 3: Implementation Loop
- Execute task-by-task
- Keep progress log updated
- Validate after each meaningful step

### Phase 4: Verification
- Run relevant tests/checks
- Confirm edge cases and error behavior
- Summarize residual risks

### Phase 5: Completion
- Produce concise change summary
- List verification evidence
- Capture follow-up actions

## Command Surface
- `new feature [name]`
- `resume feature`
- `feature status`
- `complete feature`
- `analyze [request]`
- `break down [feature]`
- `implement [task]`
- `next task`

## File Responsibilities
- `active-development/current-feature.md`: live feature state
- `completed-features/[feature-name].md`: archived result log
- `development-standards.md`: coding/testing quality defaults

## Quality Standards (Default)
- Prefer TypeScript-safe implementations
- Keep behavior grounded to existing APIs/types/schema
- Pair significant changes with targeted tests where feasible
- Preserve API error consistency and logging clarity

## Safety Rules
- Do not claim capabilities beyond current environment.
- Treat docs as guidance and verify against code.
- If command/docs conflict exists, `package.json` and source files win.
