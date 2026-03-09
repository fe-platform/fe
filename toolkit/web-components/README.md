# @feo/fe-web-components

Three web components for assembling pages from HTML fragments without a build step or framework.

## Components

| Element | Role |
|---|---|
| `<html-include>` | Fetches an HTML fragment and injects it in place |
| `<fe-component>` | Declares a reusable template with scoped styles |
| `<fe-compose>` | Instantiates a component, filling named slots |

## Install

Via [esm.sh](https://esm.sh) from JSR — add to your import map:

```json
{
  "imports": {
    "@feo/fe-web-components": "https://esm.sh/jsr/@feo/fe-web-components"
  }
}
```

Then in your module script:

```js
import "@feo/fe-web-components";
```

Or import individual elements:

```js
import "@feo/fe-web-components/html-include";
import "@feo/fe-web-components/fe-component";
import "@feo/fe-web-components/fe-compose";
```

Each file calls `customElements.define` with a guard (`if (!customElements.get(...))`) so importing multiple entry points is safe-

## Usage

### `<html-include>`

Fetches an HTML fragment and replaces its own content with the response.

```html
<html-include href="fragments/header" loading="eager"></html-include>
<html-include href="fragments/sidebar"></html-include>
```

**Attributes**

| Attribute | Values | Description |
|---|---|---|
| `href` | URL | Fragment URL. The `.html` extension is stripped before fetching. |
| `loading` | `eager` / _(absent)_ | `eager` fragments are fetched immediately. Others lazy-load via `IntersectionObserver` with a 400 px root margin, or immediately if already in the viewport. |
| `state` | `loaded` / _(absent)_ | Set by the element once content is injected. Prevents re-fetch on reconnect. |

**Events**

| Event | Target | Bubbles | Description |
|---|---|---|---|
| `load` | `<html-include>` | Yes | Fires after each fragment loads successfully. |
| `fragments-ready` | `document.body` | No | Fires once all `loading="eager"` fragments have loaded. `body.classList` also receives `ready` at this moment. |

---

### `<fe-component>`

Declares a reusable template. Slots are standard HTML `<slot>` elements inside the template markup.

**Visibility**: `<fe-component>` elements have `opacity: 0` and `transition: opacity .5s` by default. They become visible (`opacity: 1`) once `body.classList` contains `ready`.

```html
<fe-component name="Card">
  <style>
    .card { border: 1px solid var(--rule); padding: 1rem; }
  </style>
  <div class="card">
    <slot name="title"></slot>
    <slot name="body"></slot>
  </div>
</fe-component>
```

On upgrade, the element:
1. Moves each `<style>` and `<link rel="stylesheet">` to `document.head`, rewriting selectors to `[data-fe-id="Card"] .card { ... }`.
2. Snapshots all remaining `childNodes`.
3. Clears its own `innerHTML`.

The element stays in the DOM empty, acting as a registry entry that `<fe-compose>` looks up by name.

**Attributes**

| Attribute | Description |
|---|---|
| `name` | Required. Unique component name. Used as the CSS scope identifier. |

---

### `<fe-compose>`

Instantiates a component declared by `<fe-component>`. Slot children are placed into matching `<slot>` elements in the template.

**Visibility**: `<fe-compose>` elements have `opacity: 0` and `transition: opacity .5s` by default. They become visible (`opacity: 1`) once `body.classList` contains `ready`.

```html
<fe-compose name="Card">
  <span slot="title">Hello</span>
  <p slot="body">World</p>
</fe-compose>
```

Extra attributes on `<fe-compose>` (other than `name`, `data-fe-id`, `slot`) are forwarded to the root element of the template.

```html
<fe-compose name="Card" style="border-color: red">...</fe-compose>
```

**Attributes**

| Attribute | Description |
|---|---|
| `name` | Required. Must match a `<fe-component name="...">` already in the document. |
| `slot` | Standard slot attribute for nesting compositions. Not forwarded to the template root. |

---

## CSS scoping

`<fe-component>` rewrites styles with a regex rather than shadow DOM: `.card` becomes `[data-fe-id="Card"] .card`. `@`-rules and `:root` selectors are left unchanged. `<fe-compose>` sets `data-fe-id="Name"` on itself before filling slots, so all composed children inherit the scope.

## Notes

- **Define order matters** when registering components inline: `html-include` → `fe-component` → `fe-compose`. The main entry (`"."`) handles this automatically.
- Multiple `<fe-compose>` elements can reference the same `<fe-component>`. Each call to `target.content` returns a fresh `DocumentFragment` clone.

## License

MIT
