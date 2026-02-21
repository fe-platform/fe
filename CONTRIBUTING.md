# Contributing

## Toolchain

**Bun only.** No Node, npm, webpack, Vite, or Rollup. Install [Bun](https://bun.sh) before anything else.

## Setup

```bash
# Install dependencies for packages that declare them
cd mfe-b && bun install && cd ..
cd shell && bun install && cd ..
cd devtools && bun install && cd ..
```

## Building and serving the full stack

```bash
fe build mfe-a
fe build mfe-b
fe build devtools
fe admin upload mfe-a
fe admin upload mfe-b
fe admin upload devtools
# edit sandbox/configs/platform.json "routes" if needed
fe build shell
fe serve
```

## Developing an MFE in isolation

```bash
fe dev mfe-a     # sandbox at http://localhost:3000
```

Edit `src/` — Bun rebuilds, SSE notifies the browser, module swaps in-place. No page reload.

> **Note:** `dev` mode only maps the target MFE in its import map. If the MFE imports other `fe()` packages (e.g. `mfe-b` importing `mfe-a`), those deps won't resolve in the sandbox. Build and upload them first, then use `serve` instead.

## Publishing a new MFE version

```bash
# 1. Build
fe build mfe-a

# 2. Upload — registers the artifact in sandbox/configs/platform.json "packages"
fe admin upload mfe-a
# → Uploaded fe(@acme/mfe-a)@1.0.0 → ./uploads/mfe-a/1.0.0/index.js

# 3. Activate — edit sandbox/configs/platform.json "routes" to point to the new version
#    "routes": { "/": "fe(@acme/mfe-a)@1.0.0" }

# 4. Rebuild shell to embed the updated config
fe build shell && fe serve
```

`admin upload` writes to `packages` only — it never touches `routes`. Artifact publishing and version activation are distinct steps with different access requirements.

## Linking a new `fe()` dependency

The `link` command adds the dep as a `devDependency` with a `file:` URI and runs `bun install`, so TypeScript resolves the import directly via `node_modules` without any `tsconfig` path config:

```bash
fe link mfe-b mfe-a
```

For packages in separate repositories, replace `file:../mfe-a` with a git URI manually — nothing else changes:

```json
"fe(@acme/mfe-a)": "git+https://github.com/org/mfe-a#v1.0.0"
```

## How `fe()` externalization works

`build.ts` reads `devDependencies` from the target's `package.json` and passes any key starting with `fe(` to `Bun.build`'s `external` option. The naming convention itself is the build signal — no extra config needed.

## Hot reload internals

1. Bun file watcher detects a change in `src/`
2. Bun rebuilds (typically <100ms)
3. SSE (`/__dev`) pushes `{ t: timestamp }`
4. Browser: `unmount()` tears down the current render; `import("/index.js?t=<timestamp>")` loads the fresh module under a new URL (bypasses native module registry cache); `render()` mounts the new version

`pendingTs` on the server holds the latest completed rebuild timestamp. New SSE connections drain it immediately — reconnecting tabs never miss a build.

## Code guidelines

- Source files: max 180 lines — split immediately when exceeded
- No comments unless logic is genuinely non-obvious; no section headers or doc comments
- Prefer functions over classes
- No stubs, mocks, or temporary workarounds — production-ready code only
- `fe(...)` packages must go in `devDependencies`, not `dependencies` — `build.ts` reads `devDeps`
- Do not add workspace or monorepo config — this is a plain directory, not an npm workspace

## Pre-PR checklist

Before opening a pull request, update all of the following to reflect the current state:

- [ ] All affected `AGENTS.md` files
- [ ] All affected `README.md` files (root and any relevant subpackage)
- [ ] `CONTRIBUTING.md` — if any workflow, setup step, or development pattern changed
- [ ] `docs/` — archive any plan docs whose implementing PR is landing; add `> **Status:** COMPLETED / ARCHIVED` header and update the title
