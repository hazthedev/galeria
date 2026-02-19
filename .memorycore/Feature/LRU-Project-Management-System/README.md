#  LRU Project Management System
*Optional extension for managing multiple coding workstreams*

## Purpose
Track concurrent project contexts using LRU ordering so Rover can quickly load the most relevant context without memory bloat.

## Codebase-Aligned Workstream Types
- `auth-tenant`
- `photo-pipeline`
- `moderation`
- `lucky-draw`
- `attendance`
- `export`
- `subscription-usage`
- `platform-admin`

## Commands
- `new [type] project [name]`
- `load project [name]`
- `save project`
- `list projects`
- `archive project [name]`

## Separation of Concerns
- `save`: updates Rover/Hazrin memory files
- `save project`: updates active project state for this LRU subsystem

## Benefits
- Faster context switching between major feature domains
- Cleaner continuity for long-running implementation tracks
- Reduced chance of mixing unrelated workstream details

## Compatibility
- Works with Feature-Dev workflow (`load feature-dev`) so per-feature execution can run inside the active LRU project context.

## Constraint
This extension keeps `.memorycore` structure intact and does not modify app runtime code.
