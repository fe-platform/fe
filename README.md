<div align="center">

# ⚯ fe

**Ship independently. Compose natively.**

</div>

---

## Structure

```
/                          # Not a npm package — plain directory
├── mfe-a/                 # Standalone microfrontend
├── mfe-b/                 # Microfrontend that composes mfe-a
├── shell/                 # Host app that renders mfe-b
├── cli/                   # Build, serve, dev, link, and admin commands
├── configs/
│   └── import-map.json    # Maps fe() specifiers → URLs (the deployment config)
└── uploads/               # Local filesystem "registry" (swap for CDN in production)
```

## The `fe()` specifier scheme

MFEs import each other using the `fe(@scope/package)` package naming convention:

```ts
import { render } from "fe(@acme/mfe-a)";
```

- **Package names** follow the `fe(@scope/name)` pattern — this is the package `name` field in `package.json`.
- **At build time**: Bun externalizes all packages whose names start with `fe(` (read from `devDependencies`) — they are not bundled.
- **At runtime**: The browser resolves `fe(@acme/mfe-a)` to a URL via the injected `<script type="importmap">`.
- This convention makes federated dependencies universally identifiable: any `fe(...)` import is a cross-MFE boundary.

The `fe()` wrapper is a plain package name string, not a URL scheme. Import maps match it as a bare specifier.

## MFE interface

Every MFE exports a single `render` function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The return value is an **unmount** function for cleanup. No framework coupling.

## CLI usage (run from repo root)

```bash
# Build an MFE or the shell
bun cli/src/index.ts build mfe-a
bun cli/src/index.ts build mfe-b
bun cli/src/index.ts build shell   # also injects import map into HTML

# Serve the built shell
bun cli/src/index.ts serve         # http://localhost:3000

# Dev mode: sandbox + hot reload for a single MFE
bun cli/src/index.ts dev mfe-a     # http://localhost:3000

# Wire up a fe() dependency between packages (TypeScript + runtime)
bun cli/src/index.ts link mfe-b mfe-a

# Upload a built MFE to the local registry
bun cli/src/index.ts admin upload mfe-a
```

## Workflow

### Building and running the full stack

```bash
bun cli/src/index.ts build mfe-a
bun cli/src/index.ts build mfe-b
bun cli/src/index.ts build shell
bun cli/src/index.ts serve
```

### Publishing a new version of an MFE

```bash
# 1. Build
bun cli/src/index.ts build mfe-a

# 2. Upload (prints the URL, no auth for filesystem backend)
bun cli/src/index.ts admin upload mfe-a
# Uploaded fe(@acme/mfe-a)@1.0.0
# URL: ./uploads/mfe-a/1.0.0/index.js
#
# Update configs/import-map.json manually:
#   "fe(@acme/mfe-a)": "./uploads/mfe-a/1.0.0/index.js"

# 3. Edit configs/import-map.json (or let a CD pipeline do it):
#    "fe(@acme/mfe-a)": "./uploads/mfe-a/1.0.0/index.js"

# 4. Rebuild shell to inject the new import map, then serve
bun cli/src/index.ts build shell && bun cli/src/index.ts serve
```

### Linking a new MFE dependency

The `link` command adds a `devDependency` with a `file:` URI and runs `bun install`,
so TypeScript resolves the `fe()` import directly from `node_modules` without any
`tsconfig` paths config:

```bash
# Make mfe-b depend on mfe-a
bun cli/src/index.ts link mfe-b mfe-a
```

For packages in separate repos, swap `file:../mfe-a` for a git URI — nothing else changes:

```json
"fe(@acme/mfe-a)": "git+https://github.com/org/mfe-a#v1.0.0"
```

### Developing an MFE in isolation

```bash
bun cli/src/index.ts dev mfe-a
# Opens a sandbox at http://localhost:3000 that renders mfe-a standalone.
# Edit src/ → Bun rebuilds → SSE notifies browser → location.reload().
# No HMR runtime. Full reload is fast enough with Bun.
```

## How `fe()` deps are externalized at build time

`build.ts` reads `devDependencies` from each package's `package.json` and externalizes
any entry whose key starts with `fe(`. This means the package name convention _is_ the
build signal — no extra config file needed.

```json
// mfe-b/package.json
{
  "devDependencies": {
    "fe(@acme/mfe-a)": "file:../mfe-a"
  }
}
```

At build time, `fe(@acme/mfe-a)` is left as an external import. At runtime, the browser
resolves it via the import map in `configs/import-map.json`.

## Hot reload design

No runtime, no WebSocket, no module graph:
1. Bun file watcher detects changes in `src/`
2. Bun rebuilds (typically <100ms)
3. Server-Sent Events (`/__dev`) push a `reload` event
4. Browser: `new EventSource("/__dev").onmessage = () => location.reload()`

Import maps are immutable once parsed — full reload is the only clean option and
with Bun's build speed it's effectively instant.

## Upload / config separation (intentional design)

The `admin upload` command only **publishes an artifact** and prints its URL.
It does **not** update `configs/import-map.json`.

This separation is deliberate:
- **Anyone can upload** a candidate build (no auth needed for artifact storage).
- **Only a privileged actor** (a CD pipeline, or a human with repo write access)
  decides which version is active, by editing `import-map.json`.
- When moving to blob storage (S3, Azure Blob, etc.), TTL policies handle cleanup
  of unreferenced uploads — no custom cleanup code needed.
- Auth for uploads can be added later via a `FE_UPLOAD_KEY` env var check in
  `cli/src/admin.ts` without changing any other interface.
