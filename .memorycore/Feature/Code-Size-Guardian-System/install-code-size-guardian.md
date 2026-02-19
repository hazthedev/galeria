# Install Code-Size-Guardian

## Module Path
- `.memorycore/Feature/Code-Size-Guardian-System/`

## Installed Files
- `code-size-guardian-core.md`
- `code-size-config.md`
- `README.md`
- `install-code-size-guardian.md`

## Activation Check
1. Run: `load code-size-guardian`
2. Expected: Guardian command set becomes available

## Command Set
- `size check`
- `size report`
- `dashboard`
- `monitor [file]`
- `suggest split [file]`
- `refactor [file]`
- `configure guardian`
- `show config`

## Integration Notes
- Optional module (load on demand)
- Compatible with Feature-Dev flow
- Optional save-time advisory integration
- Core command contract remains unchanged (`Rover`, `save`, `update memory`, `review growth`)

## Default Setup Level
- Express defaults (500/1000 line thresholds for standard code files)
