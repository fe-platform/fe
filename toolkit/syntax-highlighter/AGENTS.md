# Agents: @feo/fe-syntax-highlighter

This package is a high-performance syntax highlighter leveraging the CSS Custom Highlight API.

## Publishing
We publish this package to **JSR**. 

### Prerequisites
- You must have `bun` installed.
- You must be authenticated with JSR (`bunx deno login` if needed).

### Command
To publish a new version:
1. Increment the `version` in `jsr.json`.
2. Run:
```bash
bunx deno publish --allow-dirty
```

## Architecture
The highlighter is modular and avoids barrel files. Exports are defined in `jsr.json`.
- `core.ts` (`.`): The main engine and registration logic.
- `languages/`: Grammar definitions for TS, JSON, Shell.
- `themes/`: Default themes including `autoTheme` (system-aware), `lightTheme`, and `darkTheme`.

## Development
To add a language:
1. Create a new file in `src/languages/` (e.g., `src/languages/rust.ts`).
2. Export a `Rule[]`.
3. Add the new file to the `exports` section of `jsr.json`.
4. Users can register it at runtime via `registerLanguage` from the main entry point.
