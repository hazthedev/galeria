# Save Project Protocol

## Trigger
`save project`

## Purpose
Persist the active project's current status without overwriting global Rover identity/relationship memory.

## Save Steps
1. Detect active project context.
2. Update:
   - Last completed step
   - Current blockers
   - Next actions
   - Key files/routes touched
3. Update `last_active` timestamp.
4. Confirm save result.

## Distinction From Global Save
- `save` -> global memory (`main/*`, diary)
- `save project` -> project record only

## Failure Handling
- If no active project: return clear prompt to load/create one.
- If incomplete data: save partial record and mark missing fields.
