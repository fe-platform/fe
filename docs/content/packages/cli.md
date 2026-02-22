---
sidebar_position: 4
---

# @fe/cli

The `fe` command-line interface. All commands run from the workspace root. Install as a dev dependency:

```bash
bun add -d @fe/cli
```

## Commands

### `fe build <target>`

Bundle an MFE:

```bash
fe build sandbox/mfe-a
```

Reads `devDependencies` from `target/package.json`, collects all `fe(...)` keys as externals, and runs `Bun.build` on `target/src/index.ts`. Output: `target/dist/index.js`.

Build the shell:

```bash
fe build shell
```

Bundles the shell's `src/index.ts`, reads `configs/platform.json`, and inlines the config into the HTML template. Output: `shellDir/dist/{app.js, index.html}`.

### `fe serve [port]`

```bash
fe serve
fe serve 8080
```

Serves the built shell from `shellDir/dist/`. Mounts the JIT bundler at `/bundle/*`. Passes `/uploads/*` requests through to the local `uploads/` directory for legacy artifact compatibility. Default port: 3000.

### `fe dev <target> [port]`

```bash
fe dev sandbox/mfe-a
fe dev sandbox/mfe-a 4000
```

Builds the target, serves a sandbox page with an inline import map, and watches `src/` for changes. On each change: rebuilds, stores the timestamp as `pendingTs`, and notifies connected browsers over SSE at `/__dev`. The browser unmounts the old instance, imports the new bundle at a cache-busting URL, and re-mounts.

### `fe link <consumer> <dep>`

```bash
fe link sandbox/mfe-b sandbox/mfe-a
```

Reads `dep/package.json` for the specifier name. Writes `{ "fe(@scope/name)": "file:../dep" }` into `consumer/package.json`'s `devDependencies`. Runs `bun install` inside `consumer/`.

### `fe publish <target>`

```bash
fe publish sandbox/mfe-a
```

Five-step flow: pre-flight typecheck → source upload to `SourceStorage` → dep version resolution → manifest registration. Writes to `packages` in `platform.json` only; never touches `routes`. See [Publishing](../guides/publishing) for the full walkthrough.

### `fe check <target|shell>`

```bash
fe check sandbox/mfe-a
fe check shell
```

Typechecks the target with `tsc --noEmit` and runs a Bun build simulation. Exits 0 on pass, 1 on failure. Used by CI and as the pre-flight step in `fe publish`. Note: writes to `dist/` as a side effect of the build simulation.

### `fe admin upload <target>`

```bash
fe admin upload sandbox/mfe-a
```

Legacy command. Copies `dist/` to `ArtifactStorage`. Registers the artifact URL in `platform.json`. Use `fe publish` for new MFEs that use JIT compilation.

## Bootstrap and Adapter Architecture

The CLI bootstraps in `bootstrap.ts`:

1. Creates `ConfigProvider` from `configs/fe.config.json`.
2. Creates default adapter instances using the config values.
3. Loads external plugins listed in `feConfig.plugins`.
4. Calls `setup(ctx, hooks)` on all plugins: builtins first, then external.

Plugins swap `ctx.adapters.*` to customise any subsystem. See [CLI Plugins](../guides/cli-plugins) for the full plugin authoring guide.

## Config

The CLI reads its own configuration through `ctx.adapters.config.get()`. The default implementation reads `configs/fe.config.json` (relative to the workspace root):

```json
{
  "plugins":      [],
  "manifestPath": "configs/platform.json",
  "uploadsDir":   "uploads",
  "sourcesDir":   "sources",
  "shellDir":     "shell"
}
```

All fields are optional. The file itself is optional; defaults apply when absent.
