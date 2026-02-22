---
sidebar_position: 3
---

# MFE Interface

Every MFE exports a single `render()` function. The return value unmounts and cleans up. Any framework is supported; the contract is framework-agnostic.

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

## The Contract

`render` takes two arguments and returns one value.

**`container`** is the `HTMLElement` the MFE should render into. The MFE owns this element for as long as it is mounted. Typically the MFE appends its own root element to the container rather than writing directly to it, which makes cleanup straightforward.

**`props`** is a plain `Record<string, unknown>`. The shell passes whatever the current context requires: user data, routing information, feature flags. The contract does not prescribe what props contain; that is a per-application agreement between the shell and its MFEs.

**The return value** is the unmount function. Calling it must remove every DOM node the MFE created and release every resource it holds (event listeners, timers, subscriptions). The platform calls this function before every hot reload and before navigating away. A leaky unmount eventually shows up as ghost event listeners or zombie DOM nodes.

## Framework Examples

### Vanilla DOM

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  el.textContent = `Hello, ${props.name ?? "world"}!`;
  container.appendChild(el);
  return () => el.remove();
}
```

### React

```tsx
import { createRoot } from "react-dom/client";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  container.appendChild(el);
  const root = createRoot(el);
  root.render(<App name={props.name as string} />);
  return () => {
    root.unmount();
    el.remove();
  };
}
```

`createRoot` on a wrapper element rather than `container` directly keeps React's tree cleanly scoped. `root.unmount()` handles React's internal teardown; `el.remove()` handles the DOM.

### SolidJS

```tsx
import { render as solidRender } from "solid-js/web";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const dispose = solidRender(() => <App name={props.name as string} />, container);
  return dispose;
}
```

Solid's `render` returns a dispose function that is already the correct unmount implementation. Assigning it directly to the return value of the MFE's `render` keeps things honest.

The shell calls `render(container, props)` and stores the returned unmount function. It has no knowledge of which framework runs inside. It does not import React, does not configure Solid's context, does not know whether the container holds a shadow DOM. Two MFEs using entirely different frameworks can be mounted in the same shell application and compose in the same page.

The contract is deliberately minimal. Anything beyond `render` and its return value is outside the platform's scope — intentionally.

