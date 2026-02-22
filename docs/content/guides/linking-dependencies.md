---
sidebar_position: 3
---

# Linking Dependencies

How `fe link` wires `fe()` devDependencies between packages using `file:` URIs and `bun install`.

## What `fe link` Does

```bash
fe link <mfe-directory> <mfe-directory>
```

`fe link <consumer> <dep>` does three things:

1. Reads `name` from `dep/package.json` (for example, `fe(@acme/mfe-a)`).
2. Writes `{ "fe(@acme/mfe-a)": "file:../mfe-a" }` into `consumer/package.json`'s `devDependencies`.
3. Runs `bun install` inside `consumer/`.

After this, `consumer/node_modules/fe(@acme/mfe-a)` is a symlink pointing to `../mfe-a`. TypeScript follows that symlink and resolves imports from `fe(@acme/mfe-a)` without any `tsconfig.json` path configuration.

## Why `devDependencies`

The `fe()` dependency belongs in `devDependencies`, not `dependencies`. The reason is mechanical: `readFeDepKeys` (the function that drives build externalization) specifically filters `devDependencies`. Placing a `fe(...)` entry under `dependencies` would cause it to be ignored by the build system and potentially bundled into the output, which is exactly the wrong outcome.

The conceptual reason aligns with the mechanical one: the `fe()` entry is not a runtime bundle you ship. It is a type-resolution aid for local development. At runtime, the browser resolves the specifier via an import map. The `devDependencies` placement reflects that accurately.

## TypeScript Resolution Without Path Config

The `file:` URI that `fe link` writes makes `bun install` create a symlink at exactly the path that TypeScript's module resolution algorithm looks up for the bare import. Because the symlink directory name matches the import specifier exactly (`node_modules/fe(@acme/mfe-a)`), TypeScript finds the package's types through normal module resolution. No `paths`, no `baseUrl`, no tsconfig trickery.

## Cross-Repo Dependencies

`fe link` is a local development convenience. For packages in separate repositories, set the `devDependency` manually using a git URI:

```json
{
  "devDependencies": {
    "fe(@acme/mfe-a)": "git+https://github.com/acme/mfe-a#v1.0.0"
  }
}
```

Then run `bun install` in the consumer directory. Bun clones the repo, and TypeScript resolves the package the same way it does with a `file:` URI. The build externalization logic is unchanged: `fe(` prefix, `devDependencies`, external in the bundle.

At runtime, the import map URL for `fe(@acme/mfe-a)` can point to Source Storage, a local server, or any URL, completely independent of where the source lives during development.
