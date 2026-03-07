# Specifier Migration: `fe(scope/name)` to `@scope/fe.name`

This document is a plan only. No changes have been made to the codebase.
Implement after reviewing and approving this plan.

---

## Why

The `fe()` format contains parentheses, which are invalid in npm and jsr.io package
names. This means MFE packages cannot be published to public registries, and scope-based
publish access control (which registries enforce natively on `@scope/*`) cannot be used.

The new format shifts the platform identity into the name segment while keeping the scope
where registries can enforce ownership.

---

## New format

```
old:  fe(acme/mfe-a)          @  1.0.0
new:  @acme/fe.mfe-a          @  1.0.0
      └──┬──┘ └──┬──┘
         │       └── name segment: "fe." prefix signals MFE identity
         └────────── scope: registry-enforced, org-owned
```

Detection convention (replaces `startsWith("fe(")`):

```ts
function isMfeSpecifier(key: string): boolean {
  return /^@[^/]+\/fe\./.test(key);
}
```

Version parsing (replaces split on `")@"`):

```ts
function parseSpecVersion(sv: string): { specifier: string; version: string } {
  const at = sv.lastIndexOf("@");
  // at > 0 because the name itself starts with "@"
  return { specifier: sv.slice(0, at), version: sv.slice(at + 1) };
}
```

Slug extraction (replaces `fe(acme/mfe-a)` → `mfe-a`):

```ts
function slugFromSpecifier(specifier: string): string {
  // "@acme/fe.mfe-a" → "mfe-a"
  return specifier.split("/").pop()!.replace(/^fe\./, "");
}
```

---

## Package name mapping

### Toolkit (published)

| Old name            | New name              |
|---------------------|-----------------------|
| `fe(acme/devtools)` | `@acme/fe.devtools`   |
| `fe(acme/store)`    | `@acme/fe.store`      |
| `fe(acme/network)`  | `@acme/fe.network`    |

### Sandbox MFEs (not published, local only)

| Old name            | New name              |
|---------------------|-----------------------|
| `fe(acme/mfe-a)`    | `@acme/fe.mfe-a`      |
| `fe(acme/mfe-b)`    | `@acme/fe.mfe-b`      |

### Platform packages (no change)

`@fe/core`, `@fe/cli`, `@fe/runtime`, `@fe/compiler`, `@fe/jit-plugin-react`,
`@fe/jit-plugin-solid` are platform infrastructure, not MFEs. They keep their names.

`@fe-platform/syntax-highlighter` and `@fe-platform/web-components` are already
registry-compatible; assess separately whether they need the `fe.` name convention.

---

## Files to change

### `packages/cli/src/helpers.ts`

- `readFeDeps`: change filter from `key.startsWith("fe(")` to `isMfeSpecifier(key)`
- `readFeDepKeys`: same filter change
- `slugFromSpecifier`: update parsing logic (see above)
- `parseSpecVersion`: update split logic (see above)
- Add and export `isMfeSpecifier`

### `packages/core/src/types.ts`

No type changes required. `Record<string, string>` fields already accept the new format.
Update JSDoc comments and any inline examples.

### `sandbox/configs/platform.json`

Update all keys and values:

```json
{
  "routes": {
    "/": "@acme/fe.mfe-b@1.0.0"
  },
  "devtools": "@acme/fe.devtools@1.0.0",
  "packages": {
    "@acme/fe.devtools": { "versions": { "1.0.0": { "url": "...", "deps": {} } } },
    "@acme/fe.mfe-a":   { "versions": { "1.0.0": { "url": "...", "deps": {} } } },
    "@acme/fe.mfe-b":   {
      "versions": {
        "1.0.0": {
          "url": "...",
          "deps": { "@acme/fe.mfe-a": "^1.0.0" }
        }
      }
    }
  }
}
```

### `sandbox/mfe-a/package.json`

- `"name"`: `"fe(acme/mfe-a)"` → `"@acme/fe.mfe-a"`

### `sandbox/mfe-b/package.json`

- `"name"`: `"fe(acme/mfe-b)"` → `"@acme/fe.mfe-b"`
- `devDependencies` key: `"fe(acme/mfe-a)"` → `"@acme/fe.mfe-a"` (value `file:../mfe-a` unchanged)

### `sandbox/host-app/package.json`

- `devDependencies` key: `"fe(acme/mfe-b)"` → `"@acme/fe.mfe-b"` (value `file:../mfe-b` unchanged)

### `sandbox/mfe-b/src/index.tsx`

- `import { render as renderA } from "fe(acme/mfe-a)"` → `"@acme/fe.mfe-a"`

### `sandbox/host-app/tests/host.spec.ts`

Update all string literals that reference old specifiers.

### `toolkit/devtools/package.json`

- `"name"`: `"fe(acme/devtools)"` → `"@acme/fe.devtools"`

### `toolkit/store/package.json`

- `"name"`: `"fe(acme/store)"` → `"@acme/fe.store"`

### `toolkit/network/package.json`

- `"name"`: `"fe(acme/network)"` → `"@acme/fe.network"`

### `packages/compiler/src/jit.ts` (and any other compiler source)

Audit for any hardcoded `fe(` string matching in the JIT bundler. Update to use the new
detection pattern. The externals logic reads from `readFeDepKeys` in helpers, so it will
update automatically once helpers.ts is fixed.

### `node_modules` symlinks

After changing package names in package.json files, re-run `bun install` at the workspace
root. Bun will create new symlinks at `node_modules/@acme/fe.mfe-a` etc. and remove old
`node_modules/fe(acme/mfe-a)` symlinks.

---

## Documentation files to update

Every occurrence of the old format in the following files:

- `README.md` (root)
- `CLAUDE.md` / `AGENTS.md` (root, symlinked to docs/)
- `sandbox/configs/AGENTS.md`
- `sandbox/host-app/AGENTS.md`, `README.md`
- `sandbox/mfe-a/AGENTS.md`, `README.md`
- `sandbox/mfe-b/AGENTS.md`, `README.md`
- `toolkit/devtools/AGENTS.md`
- `toolkit/store/AGENTS.md`
- `toolkit/network/AGENTS.md`
- `packages/core/AGENTS.md`
- `packages/cli/AGENTS.md`
- `packages/runtime/AGENTS.md`

In AGENTS.md files, update the `⟿ fe() convention` section to describe the new format,
the detection regex, and the version parsing logic.

The heading and section name can evolve from "fe() convention" to "fe. specifier
convention" or simply "MFE specifier convention".

---

## Disclaimer to add (docs)

Add immediately under the top-level heading in `README.md` and, if there is a docs site
index page, there as well:

```
This platform is under active development. Interfaces, conventions, and package names
are changing. Do not use it in production yet. Version 1.0 will be the first
production-ready release, with the core user and developer stories addressed and stable.
```

Keep the prose in line with the voice guidelines (no emojis, no harsh words, earnest tone).

---

## JSR publishing steps

These commands assume `jsr.json` (or `package.json` with `"exports"`) is correctly
configured in each toolkit package directory before publishing.

### Publish new names

Run from each toolkit package directory:

```bash
# store
cd toolkit/store
npx jsr publish   # publishes @acme/fe.store

# network
cd toolkit/network
npx jsr publish   # publishes @acme/fe.network

# devtools
cd toolkit/devtools
npx jsr publish   # publishes @acme/fe.devtools
```

Or equivalently with Deno:

```bash
deno publish   # run from within each package directory
```

### Deprecate old names

JSR deprecation via CLI (verify this command against current jsr CLI docs before running,
as the JSR CLI is still evolving):

```bash
npx jsr deprecate @acme/fe-old-name "Renamed to @acme/fe.store. See migration guide."
```

If the `jsr deprecate` subcommand is not yet available, deprecation can be done through
the jsr.io web UI: package settings page has a deprecation field.

Note: the old names (`fe(acme/store)` etc.) were never published to jsr.io because the
parentheses made them invalid. There are no old jsr packages to deprecate. The
deprecation step is only relevant if you previously published under any interim name.

### `jsr.json` shape for each toolkit package

Each toolkit package will need a `jsr.json` (or equivalent in `package.json`) before
first publish:

```json
{
  "name": "@acme/fe.store",
  "version": "0.1.0",
  "exports": "./src/index.ts"
}
```

JSR publishes TypeScript source directly, which aligns with the source-first deployment
model this platform already uses.

---

## Order of operations

1. Update `packages/cli/src/helpers.ts` first — detection logic is foundational.
2. Update all `package.json` name and devDependency fields.
3. Run `bun install` at workspace root to rebuild symlinks.
4. Update `platform.json` specifier keys and values.
5. Update TypeScript source imports.
6. Update tests.
7. Run `bun run typecheck` and `bun run build` to confirm no regressions.
8. Update all AGENTS.md and README.md files.
9. Add the disclaimer to README.md.
10. Add `jsr.json` to each toolkit package.
11. Publish toolkit packages to JSR.
12. Commit and push on branch `claude/mfe-specifier-ideation-GMvC6`.
