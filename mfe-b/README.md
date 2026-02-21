# fe(@acme/mfe-b)

Microfrontend that composes `fe(@acme/mfe-a)`. Demonstrates cross-MFE dependency composition using the `fe()` specifier scheme.

```ts
import { render as renderA } from "fe(@acme/mfe-a)";  // external — never bundled

export function render(container: HTMLElement, props: Record<string, unknown>): () => void {
  // renders own chrome, delegates content area to mfe-a
  const unmountA = renderA(wrapper, props);
  return () => { unmountA(); wrapper.remove(); };
}
```

`mfe-a` is not bundled into `mfe-b`'s output — it stays external at build time and resolves at runtime via the platform's import map injection. Both MFEs unmount cleanly through the returned cleanup function.

Part of the [fe microfrontend platform](../README.md).
