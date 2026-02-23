
# Contributing

How to contribute to the fe platform: setup, development workflows, coding standards, and PR guidelines.

## Toolchain

**Bun only.** No Node, npm, webpack, Vite, or Rollup. Install [Bun](https://bun.sh) before anything else:

```bash
curl -fsSL https://bun.sh/install | bash
bun --version
```

## Setup

Clone the repository and install all workspace dependencies from the repo root:

```bash
git clone <repo-url>
cd fe
bun install
```

## Building and Serving the Full Stack

```bash
fe publish <mfe-directory>
fe publish <mfe-directory>
fe publish toolkit/devtools
# edit sandbox/configs/platform.json "routes" if needed
fe build shell
fe serve
```

Open `http://localhost:3000`.

## Developing an MFE in Isolation

```bash
fe dev <mfe-directory>
```

A sandbox page opens at `http://localhost:3000`. Edit any file in `<mfe-directory>/src/`. Bun rebuilds, the SSE stream notifies the browser, and the module swaps in-place without a page reload.

`dev` mode maps only the target MFE in its import map. If the MFE imports other `fe()` packages (as `mfe-b` imports `mfe-a`), those specifiers will not resolve in the dev sandbox. Publish the dependencies and use `fe serve` instead.

## Publishing a New Version

```bash
fe build <mfe-directory>
fe publish <mfe-directory>
```

`fe publish` pre-flight type-checks, uploads source, and registers the package entry in `sandbox/configs/platform.json`. To make the new version live, update `routes` in `platform.json` and rebuild the shell.

## Linking a New `fe()` Dependency

```bash
fe link <mfe-directory> <mfe-directory>
```

This writes `"fe(@acme/mfe-a)": "file:../mfe-a"` to `<mfe-directory>/package.json`'s `devDependencies` and runs `bun install`. For cross-repo dependencies, set the git URI manually and run `bun install`.

## CLI Config

The CLI reads `configs/fe.config.json` through the `ConfigProvider` adapter. All fields are optional:

```json
{
  "plugins":      [],
  "manifestPath": "configs/platform.json",
  "uploadsDir":   "uploads",
  "sourcesDir":   "sources",
  "shellDir": "shell"
}
```

Plugins access config via `ctx.adapters.config.get()`, not by importing from CLI source files.

## How Externalization Works

`helpers.ts:readFeDepKeys` reads `devDependencies` from the target's `package.json` and returns every key starting with `fe(`. Those keys become the `external` list for `Bun.build`. The naming convention is the complete mechanism. No separate config is needed.

## HMR Internals

1. Bun's file watcher detects a change in `src/`.
2. Bun rebuilds (typically under 100ms for small MFEs).
3. The server stores the completed rebuild timestamp in `pendingTs`.
4. SSE at `/__dev` pushes `{ t: timestamp }` to all connected tabs.
5. The browser calls `unmount()` on the current instance, imports `/index.js?t=<timestamp>` (the query string bypasses the native module registry), and calls `render()` with the fresh module.

New SSE connections receive `pendingTs` immediately, so reconnecting tabs never miss a build.

## Code Guidelines

- Source files: max 180 lines. Split when exceeded.
- No comments unless the logic is genuinely non-obvious. No section header comments.
- Functions over classes.
- No stubs, mocks, or temporary workarounds. Production-ready code only.
- `fe(...)` packages go in `devDependencies`, never `dependencies`.
- Plugins read config via `ctx.adapters.config.get()`, not from CLI internals.

## Pre-PR Checklist

Before opening a pull request, update all of the following to reflect the current state:

- [ ] All affected `AGENTS.md` files
- [ ] All affected `README.md` files (root and any relevant subpackage)
- [ ] `CONTRIBUTING.md` (if any workflow, setup step, or development pattern changed)
- [ ] `docs/` (archive any plan docs whose implementing PR is landing; add `> **Status:** IMPLEMENTED` header and update the title)
- [ ] No `<!-- TODO -->` comments remain in any content file you touched
