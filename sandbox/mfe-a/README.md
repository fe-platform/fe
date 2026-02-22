# fe(@acme/mfe-a)

React microfrontend — no cross-MFE dependencies.

Exports the standard MFE render interface:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

Implemented with **React 19** (`createRoot` / `root.render()`). The host calls `render()` and receives an unmount function; the React root is created and destroyed inside the MFE — the host has no knowledge of the framework.

Used by `mfe-b` as a composed dependency. Demonstrates how a framework-based MFE integrates transparently into the platform contract.

Part of the [fe microfrontend platform](../../README.md).
