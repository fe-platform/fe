# Agent Guide — fe-platform

This file is the authoritative guide for AI agents (Claude, Codex, etc.) working in this repo.
`CLAUDE.md` symlinks here.

## Repo layout

```
/
├── mfe-a/          Standalone microfrontend — exports render()
├── mfe-b/          Composes mfe-a — exports render(), imports fe(@acme/mfe-a)
├── shell/          Host app — imports fe(@acme/mfe-b), renders into <div id="app">
├── cli/src/        CLI tools: build, serve, dev, link, admin
│   ├── index.ts    Entry point / command router
│   ├── build.ts    Bun build wrapper (externalizes fe() deps)
│   ├── serve.ts    Static file server for built shell
│   ├── dev.ts      Dev sandbox with SSE hot reload
│   ├── link.ts     Wires fe() devDependency + bun install
│   ├── admin.ts    Upload artifact to local registry
│   └── config.ts   Shared paths and helpers
└── configs/
    └── import-map.json   Active specifier → URL mapping
```

## Key conventions

### `fe()` package naming

Federated MFE packages use the naming pattern `fe(@scope/name)` as their `package.name`.
This is the import specifier used in source code:

```ts
import { render } from "fe(@acme/mfe-a)";
```

This is **not** a URL scheme. It is a bare specifier matched by the browser's import map.

### `devDependencies` as the externalization signal

`build.ts` reads `devDependencies` from each `package.json` and externalizes any key
that starts with `fe(`. No separate config is needed — the naming convention is the signal.

### Import map

`configs/import-map.json` maps each `fe()` specifier to a URL served at runtime.
The shell build injects it into `shell/index.html` via the `<!-- __IMPORT_MAP__ -->`
placeholder.

Update the import map **manually** (or via CD pipeline) after uploading a new artifact.
The `admin upload` command prints the required JSON snippet.

## Running things

All CLI commands are run from the repo root with `bun cli/src/index.ts <command>`.

| Command | Effect |
|---|---|
| `build mfe-a` | Bun bundles `mfe-a/src/index.ts` → `mfe-a/dist/` |
| `build mfe-b` | Bun bundles `mfe-b/src/index.ts` → `mfe-b/dist/` |
| `build shell` | Bundles shell + injects import map → `shell/dist/` |
| `serve` | Serves `shell/dist/` and `uploads/` on port 3000 |
| `dev mfe-a` | Sandbox server for mfe-a with SSE hot reload |
| `link mfe-b mfe-a` | Adds `fe(@acme/mfe-a)` devDep + runs bun install in mfe-b |
| `admin upload mfe-a` | Copies `mfe-a/dist/` → `uploads/mfe-a/<version>/` |

## CI

CI runs on push/PR to `main`. Steps: install deps (mfe-b, shell) → type-check all three
packages → build all three packages. No test suite yet.

## What not to do

- Do not bundle `fe(...)` imports — they must stay external.
- Do not update `configs/import-map.json` inside `admin upload`; that separation is intentional.
- Do not add framework dependencies. The render interface uses plain DOM APIs.
- Do not add workspace configuration; this is intentionally not a monorepo workspace.
