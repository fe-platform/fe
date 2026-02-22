---
sidebar_position: 5
---

# Externalization

How `fe()` imports stay external at build time. The naming convention itself is the build signal, with no extra config needed.

## The Problem It Solves

When you bundle an MFE that imports another MFE, two things could happen: the bundler could copy the dependency's code into the output (bundling), or it could leave the import statement as-is and let the browser resolve it at runtime (externalization). The platform requires the second option. If `mfe-b` bundles `mfe-a`, they become a single deployment unit, and the independence model collapses.

The challenge is telling the bundler which imports to leave external without maintaining a separate config file. The `fe()` naming convention provides the answer.

## How It Works

`@fe/cli/src/helpers.ts` exports `readFeDepKeys`, which reads a package's `devDependencies` and returns every key that starts with `fe(`:

```ts
export function readFeDepKeys(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Object.keys(pkg.devDependencies ?? {}).filter((k) => k.startsWith("fe("));
}
```

The build command passes the result directly to Bun's `external` option:

```ts
const external = readFeDepKeys(targetDir);

await Bun.build({
  entrypoints: [entry],
  outdir: distDir,
  format: "esm",
  target: "browser",
  external,
});
```

For an MFE with this `package.json`:

```json
{
  "name": "fe(@acme/mfe-b)",
  "version": "1.0.0",
  "devDependencies": {
    "fe(@acme/mfe-a)": "file:../mfe-a",
    "react": "^19.0.0",
    "solid-js": "^1.9.0"
  }
}
```

`readFeDepKeys` returns `["fe(@acme/mfe-a)"]`. `react` and `solid-js` are not prefixed with `fe(`, so they are bundled into the output as usual. Only the MFE dependency is kept external.

## Why `devDependencies`

The `fe(...)` dependency is a build-time artifact — it tells the build system what to externalize. At runtime, the browser resolves the specifier via an import map. Placing these dependencies in `devDependencies` makes this distinction explicit: they are development and type-resolution tools, not runtime bundles.

`readFeDepKeys` filters specifically on `devDependencies`. Placing a `fe(...)` package under `dependencies` would break both externalization and the conceptual model.

## No Extra Config Required

The naming convention is the complete mechanism. There is no webpack `externals` array to maintain, no Vite `rollupOptions.external` to update, no separate manifest of "what should not be bundled". Adding a new MFE dependency requires one step: adding it to `devDependencies` with the `fe(...)` name. `fe link` does this automatically. The build picks it up on the next run.
