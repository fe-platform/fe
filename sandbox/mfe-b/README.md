# fe(@acme/mfe-b)

SolidJS microfrontend that composes `fe(@acme/mfe-a)`. Demonstrates cross-MFE dependency composition using the `fe()` specifier scheme with two different frameworks.

```ts
import { render as renderA } from "fe(@acme/mfe-a)";  // external — never bundled
```

Implemented with **SolidJS** (`solid-js/web`). Renders a styled wrapper, then calls into `mfe-a` (a React MFE) to render inside it. Neither MFE knows what framework the other uses — composition happens through the `render()` contract.

`mfe-a` is not bundled into `mfe-b`'s output — it stays external at build time and resolves at runtime via the platform's import map injection. Both MFEs unmount cleanly through the returned cleanup function.

Part of the [fe microfrontend platform](../../README.md).
