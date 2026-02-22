---
sidebar_position: 1
slug: /
---

# Introduction

The web platform already has everything needed to load and run independently deployed modules. `fe` builds on that premise rather than ignoring it.

Most microfrontend tooling arrives with a bundle of abstractions designed to simulate module isolation. `fe` skips the simulation. Native ES modules are truly isolated. Import maps resolve bare specifiers to URLs in the browser. Dynamic `import()` loads them on demand. Stack those three primitives correctly and you have a microfrontend platform. The rest is convention.

## Mental Model

There are three moments in an MFE's life: **build**, **deploy**, and **runtime**.

At build time, any cross-MFE dependency is externalized — left out of the bundle entirely. The bundle has a deliberate hole where the dependency should be.

At deploy time, the MFE's metadata is registered in the platform: specifier, version, URL, and which other `fe()` packages it depends on.

At runtime, the browser fills the holes. The platform resolves the dependency graph, injects import maps, and lets the browser's native module system do the rest.

Nothing bundles across MFE boundaries. Not in dev, not in CI, not in production.

## The fe() Convention

Cross-MFE imports use a naming convention rather than a URL:

```ts
import { render } from "fe(@acme/mfe-a)";
```

`fe(@acme/mfe-a)` is a plain package name. It appears as the `name` field in `package.json`, as a bare specifier in `import` statements, and as a lookup key in the platform registry. The `fe(` prefix tells the build tool to externalize it — no additional config required.

One string; three roles. This pattern of collapsing concerns into a single, unambiguous convention comes up throughout the platform's design.

## The MFE Contract

Every MFE exports exactly one function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The return value unmounts and cleans up. The framework inside the MFE is entirely its own business — React, SolidJS, Svelte, or plain DOM. The host calls `render()`, receives an unmount function, and never needs to know what rendered into that container. Encapsulation not by convention but by contract.

## From HTML Load to Mounted MFE

1. The shell HTML embeds the full platform config as JSON.
2. On navigation, the runtime resolves the route to a `specifier@version`.
3. Transitive `fe()` dependencies are resolved via semver from the package registry.
4. A `<script type="importmap">` is injected for all resolved deps.
5. `import(specifier)` — the browser loads and executes.
6. `render()` is called. The MFE mounts.

Import maps accumulate across navigations, injected lazily and deduplicated. The browser handles module loading, which is rather the point.

## Where to Go From Here

To understand the design decisions in depth, [Architecture](./architecture/overview.md) covers the full system from the `fe()` specifier through to runtime resolution.

To get something running, [Getting Started](./getting-started/installation.md) walks through installation, your first MFE, and composing two MFEs together.

> Heavily influenced by and borrows concepts from the MFE architecture described at [1fe.com](https://1fe.com/).
