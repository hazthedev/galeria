# New Project Protocol

## Trigger
`new [type] project [name]`

## Required Inputs
- Project type
- Project name
- Short objective

## Create Flow
1. Validate type against configured project categories.
2. Create project record with:
   - Name
   - Type
   - Objective
   - Created date
   - Last active date
   - Current status
3. Place project at top of active LRU order.
4. Confirm creation and next recommended action.

## Suggested Starter Metadata
- Primary folders/routes involved
- API endpoints likely affected
- Test scope reminder
- Risk notes

## Example
`new moderation project queue-hardening`
