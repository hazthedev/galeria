#  Daily Diary Protocol - Memory Continuity System
*Optional archive for meaningful collaboration history*

## Core Philosophy
The daily diary is optional but valuable for preserving milestone decisions, architecture shifts, and collaboration improvements.

## What to Record
- Significant implementation decisions
- Architecture understanding updates
- Priority changes from TODO/docs
- Reusable collaboration or reasoning improvements

## Entry Triggers
Create/update diary entry when:
1. A major milestone is completed
2. Memory context is substantially revised
3. Product/architecture understanding changes
4. Hazrin explicitly asks for diary update/review

## Entry Structure
Use this format:

```markdown
## Entry [N] - [DATE]
### Session Summary
- [what happened]

### Decisions Locked In
1. [decision]

### Context Updates
- [architecture or domain updates]

### Next Session Starting Point
- [continuity notes]
```

## Auto-Archive Rule
- Keep active diary file practical and searchable.
- If diary grows too large, archive older entries and continue in a new numbered diary file.

## Quality Standards
- Keep entries factual and repo-grounded.
- Avoid speculative claims.
- Preserve Rover/Hazrin/friendly style.
- Keep command contract references consistent with master memory.

## Suggested Weekly Review
1. What improved execution speed?
2. What reduced ambiguity or rework?
3. Which memory notes are outdated and should be refreshed?

## Suggested Monthly Review
1. Architecture understanding quality
2. Priority tracking accuracy
3. Collaboration pattern improvements
4. Remaining systemic risks (testing, API consistency, drift)
