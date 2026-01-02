# TypeScript Configuration Strategy

This document describes the TypeScript configuration architecture for the FE platform monorepo.

## Overview

The monorepo uses a layered TypeScript configuration strategy with:
- **Base configurations** for shared compiler options
- **Project references** for incremental builds
- **Separate test configurations** to isolate test-only types

## Configuration Files

### Root Level

#### `tsconfig.json`
Root configuration using project references. Contains no compiler options, only references to workspace packages.

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core/plugin" },
    { "path": "./packages/create-fe-platform" }
  ]
}
```

#### `tsconfig.base.json`
Base compiler options shared across all packages. Defines strict TypeScript settings.

**Key settings:**
- `allowImportingTsExtensions: true` - Allows `.ts` extensions in imports
- `composite: true` - Enables project references
- `strict: true` - All strict type checking options
- `declaration: true` - Generates `.d.ts` files

#### `tsconfig.package.json`
Configuration for library packages (in `packages/`).

**Extends:** `tsconfig.base.json`
**Key settings:**
- `emitDeclarationOnly: true` - Only generates `.d.ts` files (Bun handles bundling)
- Excludes `**/*.test.ts` files

#### `tsconfig.test.json`
Configuration for test files.

**Extends:** `tsconfig.base.json`
**Key settings:**
- `types: ["@types/bun"]` - Includes bun:test types
- `noEmit: true` - Test files are not emitted

#### `tsconfig.app.json`
Configuration for application packages (in `apps/`).

**Extends:** `tsconfig.base.json`
**Key settings:**
- Includes DOM types for browser environments
- `emitDeclarationOnly: true`

### Package Level

Each package has its own `tsconfig.json` that extends the appropriate base:

**Library packages:**
```json
{
  "extends": "../../tsconfig.package.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Test configuration (`tsconfig.test.json`):**
```json
{
  "extends": "../../tsconfig.test.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## Type Checking

### Production Code
```bash
tsc --noEmit
```
Uses `tsconfig.json` (excludes test files).

### Test Code
```bash
tsc --project tsconfig.test.json --noEmit
```
Uses `tsconfig.test.json` (includes bun:test types).

### Complete Check
```bash
bun run typecheck
```
Runs both production and test type checks via Turborepo.

## Project References

The monorepo uses TypeScript project references for:
- **Incremental builds** - Only rebuilds changed projects
- **Type safety across packages** - Ensures dependencies are built before dependents
- **Better IDE performance** - Faster intellisense and navigation

To build with project references:
```bash
tsc --build
```

## Adding New Packages

1. Create `tsconfig.json` extending the appropriate base
2. Add to root `tsconfig.json` references array
3. If the package has dependencies on other packages, add references in package `tsconfig.json`

Example:
```json
{
  "extends": "../../tsconfig.package.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../other-package" }
  ],
  "include": ["src/**/*"]
}
```

## Cardinal Rule Alignment

This configuration aligns with **Cardinal Rule 7**: Use Bun for bundling, tsc only for `.d.ts` generation.

All package configurations set `emitDeclarationOnly: true`, ensuring TypeScript only generates type declarations while Bun handles the actual bundling via `scripts/build.ts`.
