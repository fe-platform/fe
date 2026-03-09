# ⚯ fe-platform · docs · agent-ref

## topology

```
docs/site/
├─ fragments/          content sections · fetched on demand
│  ├─ header.html      sticky top bar · logo
│  ├─ hero.html        hero section · nav cards
│  ├─ architecture.html
│  ├─ product-eng.html
│  ├─ platform-eng.html
│  └─ tutorials.html
├─ _headers            cloudflare cache optimization rules
├─ index.html          shell · ALL logic inlined · no external .css/.js
└─ favicon.png / logo.png  assets
```

## custom element system (all inlined in `index.html` · `<script type="module">`)

define order is invariant — MUST match this sequence:

```
customElements.define("html-include", HTMLInclude)   // 1st
customElements.define("fe-component", FEComponent)   // 2nd
customElements.define("fe-code",      FECode)        // 3rd
customElements.define("fe-compose",   FECompose)     // 4th ← runs LAST; html-include already upgraded by then
```

All four run synchronously. Fetch responses cannot arrive until after all four `connectedCallback`s complete. No timing races between define order and fetch resolution.

---

### `html-include` · lazy/eager content loader

```
attr: href="fragments/header"   extensionless · component strips .html if present
attr: loading="eager"           bypasses viewport check · adds self to _eagerPending
attr: state="loaded"            set after successful fetch · guards against double-load
```

- **lazy** ⟿ `connectedCallback` checks `getBoundingClientRect`; if off-screen → `IntersectionObserver` (rootMargin: 400px)
- **eager** ⟿ adds self to static `_eagerPending: Set` + calls `_load` immediately
- **`disconnectedCallback`** ⟿ cleans up observer only; fetch in-flight continues
- **body.ready** ⟿ `document.body.classList.add("ready")` fires when `_eagerPending.size === 0`; fragments-ready event also dispatched.
- **double-connectedCallback** ⟿ `fe-compose` disconnects + reconnects html-include elements during its own `connectedCallback`; two guards prevent double-load: `_fetching` (in-flight flag, reset in `finally`) prevents concurrent fetches; state check before `_eagerPending.add` prevents re-adding an already-loaded eager element (which would leave it in the set forever). `_eagerPending.delete` is called in `finally` to ensure set is cleared even on failure.

---

### `fe-component` · CSS scoping via selector rewriting (NOT shadow DOM)

```
attr: name="ComponentName"   used as scope key (NOT id — avoids duplicate-ID issues)
```

- **visibility** ⟿ `opacity: 0` by default; `opacity: 1` when `body.ready` (transition: 0.5s)
- **`connectedCallback`** ⟿ iterates `querySelectorAll("style")` · rewrites every selector to `[data-fe-id="ComponentName"] <selector>`
 · moves each `<style>` to `document.head` · then snapshots remaining child nodes into `this._snapshot`
  - skips selectors starting with `@` or containing `:root`
  - idempotent: skips rewrite if `[data-fe-id]` already present in CSS
- **`get content()`** ⟿ returns a fresh `DocumentFragment` cloned from `_snapshot` each call · supports multiple `fe-compose` elements referencing the same component (e.g. a card used four times)
- **`get content()`** ⟿ returns a fresh `DocumentFragment` — deep clone of all childNodes EXCEPT `<style>` elements
- element is `display:none` (root CSS); its `<style>` children are live in the document and apply globally after scoping

---

### `fe-compose` · slot-based composition (Light DOM)

```
attr: name="ComponentName"   must match a <fe-component name="ComponentName"> in the document
```

- **visibility** ⟿ `opacity: 0` by default; `opacity: 1` when `body.ready` (transition: 0.5s)
- **`connectedCallback`** ⟿ synchronous; runs after html-include and fe-component are already upgraded
  1. `getTarget(document, name)` → finds `<fe-component name="ComponentName">`; returns early if not found or wrong tag
  2. `this.setAttribute("data-fe-id", name)` ← set BEFORE DOM manipulation so scoped CSS applies to newly inserted children
  3. snapshots `children = Array.from(this.childNodes)` (includes html-include elements with `slot` attrs)
  4. `this.innerHTML = ""` → triggers `disconnectedCallback` on each child (observer cleanup)
  5. `target.content` → fresh `DocumentFragment` cloned from the component's snapshot (structural nodes only; styles are already in `<head>`)
  6. `content.querySelectorAll("slot")` → for each named slot, inserts matching children before it then removes slot
  7. `this.appendChild(content)` → children reconnected → `html-include.connectedCallback` fires again

---

### `fe-code` · inline syntax highlighting

```
attr: lang="ts|js|..."   maps to <pre class="lang-...">
child: <template>        if present, innerHTML used as source; otherwise textContent
```

- **`connectedCallback`** ⟿ async; dynamically imports `highlight` from `@feo/fe-syntax-highlighter`
- renders into `<pre>` then calls `highlight(this)`

---

## CSS scoping mechanism

`<fe-component id="ShellLayout">` contains a `<style>` with ALL layout + html-include rules. After `FEComponent.connectedCallback` runs, every selector is prefixed with `[data-fe-id="ShellLayout"]`. `<fe-compose id="ShellLayout">` receives `data-fe-id="ShellLayout"` and becomes the scoped root. No shadow DOM. Global CSS tokens (variables) reach through naturally.

### CSS variables (in `<style id="root-styles">` in `<head>`)

```
--bg, --ink, --mid, --accent, --rule, --dot
--card-a (Amber), --card-b (Blue), --card-c (Emerald), --card-d (Rose)
--code-bg, --code-text, --code-rule
--article-bg, --article-text, --header-height
```

Dark mode via `@media (prefers-color-scheme: dark)`.

---

## fragment authoring rules

- wrap content in `<fe-component>` for CSS scoping
- inline all `<style>` tags inside the fragment file
- use `var(--name)` for theming; variables come from root styles in `index.html`
- `@keyframes` must be top-level in a `<style>` (not nested inside another rule)
- no emojis · UTF-8 symbols ok: ✦ ❖ ◎ ➤ ⎔ ⧉ ۞ ✺
- assume `width: 100%` from host

## performance & caching

- **zero waterfalls** ⟿ all CSS and JS INLINED in `index.html`; no external `.css` or `.js` files
- **preloading** ⟿ critical fragments (`header`, `hero`) declared as `<link rel="preload" as="fetch" crossorigin="anonymous">` in `<head>`
- **esm only** ⟿ `<script type="module">`; no IIFEs
- **import maps** ⟿ `@feo/fe-syntax-highlighter` resolved via `importmap`; keep pinned to `@latest`
- **edge caching** ⟿ `_headers` sets 1-hour browser / 1-day edge cache for HTML+fragments with background revalidation

## ✗ maintenance invariants

- `index.html` is the source of truth · do not externalize its logic
- fragment filenames are extensionless in `href` attrs (`.html` stripped at fetch time)
- `customElements.define` order must stay: html-include → fe-component → fe-code → fe-compose
- `data-fe-id` must be set on `fe-compose` BEFORE `innerHTML = ""` in `FECompose.connectedCallback`
- eager html-include elements must only be added to `_eagerPending` when `_load` will execute past the state guard
