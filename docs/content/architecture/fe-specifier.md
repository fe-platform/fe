---
sidebar_position: 2
---

# The `fe()` Specifier

How `fe(@scope/name)` works as a plain package name, not a URL scheme. It is the `name` in `package.json`, a bare specifier in `import` statements, and the key in the platform's lookup service.

## What It Is

`fe(@scope/name)` is a valid npm package name. It is unusual looking, but it is just a string: the same kind of string that goes into `package.json`'s `name` field, `import` statements, and `node_modules/` directory names.

```json
{
  "name": "fe(@acme/mfe-a)",
  "version": "1.0.0"
}
```

```ts
import { render } from "fe(@acme/mfe-a)";
```

These two uses of the same string are intentionally identical. The specifier that appears in source code is the package name. There is no mapping table, no alias config, no tsconfig `paths` entry needed.

## Why This Shape

The `fe(...)` wrapper solves a detection problem. Build tools need to know which imports should be bundled and which should be left external for the browser to resolve via import maps. A naming convention provides that signal without any extra configuration.

`readFeDepKeys` in `@fe/cli` implements this detection:

```ts
export function readFeDepKeys(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Object.keys(pkg.devDependencies ?? {}).filter((k) => k.startsWith("fe("));
}
```

Any `devDependency` key that starts with `fe(` is marked external in the Bun build. The naming convention is the build signal.

## Three Surfaces, One String

The specifier appears in exactly three places, always as the same literal string:

**`package.json` name**: declares the package's identity.

```json
{ "name": "fe(@acme/mfe-a)" }
```

**Source imports**: used in TypeScript `import` statements. TypeScript resolves this to `node_modules/fe(@acme/mfe-a)` after `fe link` or a direct `bun install` with a `file:` URI.

```ts
import { render } from "fe(@acme/mfe-a)";
```

**`platform.json` packages**: the key under which the platform registry stores all versions of this package.

```json
{
  "packages": {
    "fe(@acme/mfe-a)": {
      "versions": {
        "1.0.0": { "url": "...", "deps": {} }
      }
    }
  }
}
```

## How TypeScript Resolves It

`fe link` adds the dependency to `devDependencies` with a `file:` URI:

```json
{
  "devDependencies": {
    "fe(@acme/mfe-a)": "file:../mfe-a"
  }
}
```

After `bun install`, Bun creates `node_modules/fe(@acme/mfe-a)` as a symlink to the linked package. TypeScript's module resolution finds it there. No `tsconfig.json` path mapping is needed because the import specifier matches the directory name exactly.

## How the Browser Resolves It

At runtime, `@fe/runtime` injects an import map that maps the specifier to a URL:

```html
<script type="importmap">
{
  "imports": {
    "fe(@acme/mfe-a)": "https://cdn.example.com/mfe-a/1.0.0/index.js"
  }
}
</script>
```

When the browser encounters `import("fe(@acme/mfe-a)")`, it consults this map, resolves the bare specifier to the URL, and fetches the module. The specifier that was left external by the build is now resolved by the browser, completing the circuit that the naming convention started.

## The Symbol: ⚯

You may notice the `⚯` symbol (U+26AF) appearing in the logo and internal documentation.

Formally known as the **Unmarried Partnership Symbol**, I chose it to represent the core philosophy of the `fe` platform: **Independent yet Connected**.

In a traditional monolith or a distributed monolith (via federation), applications are "married" at the build or deployment level. In `fe`, MFEs remain independent "partners": they share a runtime environment and a common goal, but they maintain their own identities, lifecycles, and deployment schedules without the rigid coupling of a traditional build-time dependency.

