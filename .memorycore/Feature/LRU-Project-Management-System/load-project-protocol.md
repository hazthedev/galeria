# Load Project Protocol

## Trigger
`load project [name]`

## Load Flow
1. Find project in active or archived list.
2. Move loaded project to top of active LRU order.
3. Surface concise project briefing:
   - Objective
   - Current status
   - Last completed step
   - Next step
   - Risks/open questions
4. Sync summary into `main/current-session.md` when appropriate.

## If Not Found
- Show close matches
- Offer `list projects`
- Offer `new [type] project [name]`

## Output Style
Keep briefing short, actionable, and aligned to current repo architecture.
