# ⚯ toolkit/web-components · agent-ref

## identity
```
jsr.json  name: "@feo/fe-web-components"  version: 0.1.0
package.json  name: "@feo/fe-web-components"  (workspace resolution + IDE support)
```

## topology
```
src/
├─ html-include.ts   HTMLInclude custom element
├─ fe-component.ts   FEComponent custom element  (exported class — fe-compose imports type)
├─ fe-compose.ts     FECompose custom element    (import type FEComponent from ./fe-component.ts)
├─ fe-code.ts        FECode custom element       (dynamic import @feo/fe-syntax-highlighter)
└─ index.ts          side-effect imports in define order
```

## define order (invariant)
```
html-include → fe-component → fe-code → fe-compose
```
`fe-compose.connectedCallback` runs last; by then all other elements are upgraded.

## element contracts

### html-include
attrs:  `href` (URL, required) · `loading="eager"` · `state="loaded"` (set by element)
guards: `_fetching` boolean — blocks concurrent fetches, cleared in `finally`
        `state="loaded"` — blocks re-fetch on reconnect
        `_eagerPending.add(this)` only when `state !== "loaded"` — prevents stuck pending set when fe-compose reconnects an already-loaded eager element
        events: `"load"` (bubbles) on `<html-include>` after each fragment loads
        `"fragments-ready"` on `document.body` (non-bubbling) when all eager pending cleared
        `document.body.classList.add("ready")` fired at the same moment
        lazy:   `IntersectionObserver` rootMargin=400px for non-eager elements

        ### fe-component
        attrs:  `name` (required, unique)
        visibility: `opacity: 0` by default; `opacity: 1` when `body.ready`
        lifecycle:

  1. move each `<style>` → `document.head`; rewrite selectors → `[data-fe-id="Name"] <sel>`
     regex: `/([^\r\n,{}]+)(?=[^{}]*\{)/g`  ·  skips `@`-rules and `:root`  ·  idempotent
  2. snapshot remaining `childNodes` via `cloneNode(true)` → `this._snapshot: Node[]`
  3. `this.innerHTML = ""` — critical: vacates element so hidden structural children
     (esp. `<details name>` exclusive accordion group members) leave the live document
get content(): DocumentFragment — fresh clone of snapshot on every call → supports N composers

### fe-compose
attrs:  `name` (required) · `slot` (not forwarded) · anything else → forwarded to template root
visibility: `opacity: 0` by default; `opacity: 1` when `body.ready`
lookup: `document.querySelector('fe-component[name="..."]')` — NOT id, NOT getTarget
exclusion list for attribute forwarding: `["name", "data-fe-id", "slot"]`
  !! `"name"` must be excluded — forwarding it overwrites the first slot element's name attribute
sets `data-fe-id` BEFORE clearing innerHTML — scoped CSS applies to all composed children
does NOT remove the fe-component — stays empty in DOM for reuse by multiple composers

### fe-code
attrs:  `lang` (ts · json · shell · html)
reads content from `<template>` child first, falls back to `textContent`
dynamic import: `await import("@feo/fe-syntax-highlighter")` — lazy, not bundled

## CSS scoping (light DOM, not shadow DOM)
`[data-fe-id="Name"]` set on `<fe-compose>` · styles scoped via selector rewriting in `<fe-component>`
requires `fe-compose { display: contents }` in consumer CSS so the element does not box

## deps
`@feo/fe-syntax-highlighter`
  runtime: dynamic import in fe-code.ts (consumer must provide in import map)
  local:   `devDependencies: workspace:*` in package.json → symlink via bun workspaces
  jsr:     `"imports": { "@feo/fe-syntax-highlighter": "jsr:@feo/fe-syntax-highlighter" }` in jsr.json

## publishing
```bash
# bump version in jsr.json (and keep package.json in sync)
bunx deno publish --allow-dirty
```
no build step — JSR publishes .ts source directly

## ✗ invariants
- !shadow DOM · all composition is light DOM + selector scoping
- !id attribute on fe-component/fe-compose · use name= (duplicate ids break accordion + querySelector)
- fe-component.innerHTML must be "" after snapshot — hidden <details name> members break exclusive accordion group
- fe-compose exclusion list must include "name" — see above
- define order must be respected when importing individual files manually
