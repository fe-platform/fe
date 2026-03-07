# fe docs assembly pattern

The docs site uses a small set of custom elements to assemble HTML pages from separate fragment files, scope styles without shadow DOM, and compose layouts from named slots. No build step. No framework. The browser does the work.

This pattern is self-contained: copy the custom element definitions from `site/index.html` into any HTML page and it works. What follows is an explanation of each piece and how they fit together.

## the four elements

| Element | Role |
|---|---|
| `html-include` | fetches an HTML fragment and renders it in place |
| `fe-component` | holds a template + scoped styles, hidden from view |
| `fe-compose` | instantiates a component, filling its named slots |
| `fe-code` | renders inline code with syntax highlighting |

---

## `html-include`

Fetches an HTML file and injects its content as `innerHTML`. No framework, no virtual DOM: just a `fetch` and an assignment.

```html
<html-include href="fragments/hero"></html-include>
```

**Lazy loading** is the default. On `connectedCallback`, the element checks whether it is in the viewport. If it is, it loads immediately. If not, it sets up an `IntersectionObserver` with a 400px root margin so content arrives before the user actually scrolls to it.

**Eager loading** skips the viewport check entirely:

```html
<html-include loading="eager" href="fragments/header"></html-include>
```

Eager elements participate in a static `_eagerPending` set. The page body starts at `opacity: 0` and transitions to `opacity: 1` only when every eager element has finished loading. This prevents layout flicker on the critical path without blocking non-critical content.

**Href format:** always extensionless. The element strips a trailing `.html` from the href if one is present, then fetches. The server (or GitHub Pages) serves `fragments/header.html` when asked for `fragments/header`.

**State guard and fetch dedup.** `_load` uses two guards: `state="loaded"` blocks any re-fetch after content is set, and a `_fetching` boolean blocks concurrent fetches (reset in `finally` so failed fetches can be retried). In `connectedCallback`, `_eagerPending.add` is guarded by the same state check so a re-connected-but-already-loaded element is never added to the pending set.

---

## `fe-component`

A hidden template that holds layout structure and styles. Its `id` is the component name.

```html
<fe-component name="ShellLayout">
    <style>
        .layout { display: grid; grid-template-columns: 220px 1fr; }
        html-include { display: block; }
    </style>
    <slot name="header"></slot>
    <div class="layout">
        <main>
            <slot name="content"></slot>
        </main>
    </div>
</fe-component>
```

The element is `display: none` via global CSS. Its `<style>` children are live in the document and apply globally, which is intentional: they need to style elements that will eventually be injected by `fe-compose`.

On `connectedCallback`, the element rewrites every CSS selector inside its `<style>` tags to be prefixed with `[data-fe-id="ShellLayout"]`. A rule like `.layout { ... }` becomes `[data-fe-id="ShellLayout"] .layout { ... }`. Rules starting with `@` (keyframes, media queries) and rules containing `:root` are left untouched. The rewrite is idempotent.

The `content` getter returns a fresh `DocumentFragment` each time: a deep clone of all child nodes except `<style>` elements. The styles stay in `fe-component` (where they live as live document styles). The structure clones go to `fe-compose`.

This is not shadow DOM. CSS variables and global tokens reach through naturally because everything is in the same document. The scoping is purely selector-based.

---

## `fe-compose`

Instantiates a component by name, fills its slots with children, and becomes the visible root.

```html
<fe-compose name="ShellLayout">
    <html-include loading="eager" href="fragments/header" slot="header"></html-include>
    <html-include href="fragments/content" slot="content"></html-include>
</fe-compose>
```

On `connectedCallback`:

1. Finds `<fe-component name="ShellLayout">` in the document.
2. Sets `data-fe-id="ShellLayout"` on itself — before any DOM changes, so scoped CSS applies to newly connected children immediately.
3. Snapshots its current children (the `html-include` elements with `slot` attributes).
4. Clears `innerHTML`, which disconnects those children and triggers their `disconnectedCallback` (observer cleanup).
5. Calls `target.content` to get a fresh clone of the component structure.
6. For each `<slot>` in the clone, inserts matching children before it, then removes the slot.
7. Appends the filled clone to itself, reconnecting the children and triggering their `connectedCallback` again.

The double `connectedCallback` on `html-include` children is expected. The state guard in `_load` handles the case where a fetch already completed. The intersection observer is cleaned up and recreated cleanly via `disconnectedCallback`/`connectedCallback`.

Attributes on `<fe-compose>` (other than `id`, `data-fe-id`, and `slot`) are copied to the first element of the composed content. This lets you pass props to the layout root.

---

## `fe-code`

Renders a code block with syntax highlighting via `@feo/fe-syntax-highlighter`.

```html
<fe-code lang="ts">
    <template>
        export function render(el: HTMLElement) { /* ... */ }
    </template>
</fe-code>
```

Use a `<template>` child to prevent the browser from interpreting the code as HTML. If no `<template>` is present, `textContent` is used. The element creates a `<pre class="lang-ts">`, sets its content, then dynamically imports and calls `highlight`.

---

## putting it together

A typical page shell looks like this:

```html
<body>
    <!-- template: hidden, holds layout + scoped styles -->
    <fe-component name="Page">
        <style>
            header { position: sticky; top: 0; }
            main { padding: 2rem; }
        </style>
        <slot name="header"></slot>
        <main>
            <slot name="body"></slot>
        </main>
    </fe-component>

    <!-- instance: fills slots, becomes visible root -->
    <fe-compose name="Page">
        <html-include loading="eager" href="fragments/header" slot="header"></html-include>
        <html-include href="fragments/intro" slot="body"></html-include>
    </fe-compose>
</body>
```

The two elements with the same `id` is intentional. `fe-component` is the definition; `fe-compose` is the use. `getTarget` (a helper also defined in the script) finds the `fe-component` by matching `id` and checking `tagName === "FE-COMPONENT"`, so the `fe-compose` element does not interfere.

---

## portability checklist

To use this pattern in another HTML page:

1. Copy the `<script type="module">` block from `site/index.html` that contains all four `customElements.define` calls.
2. Copy the `body { opacity: 0; transition: opacity 0.25s; }` and `body.ready { opacity: 1; }` rules if you want the eager-loading fade-in.
3. Add `html-include:not(:defined) { display: none; }` to hide elements before the script runs.
4. Serve fragment files without extensions, or ensure your server handles extensionless requests for `.html` files.
5. If you use `fe-code`, add `@feo/fe-syntax-highlighter` to your import map.

The `getTarget` helper, `sync` (hash navigation), and `FECode` are optional — remove what you do not need.

---

## define order

The four elements must be defined in this order:

```
html-include → fe-component → fe-code → fe-compose
```

`fe-compose.connectedCallback` runs last, after `html-include` elements inside it are already upgraded and have started their first `connectedCallback`. This ordering is what makes the double-connectedCallback sequence predictable.
