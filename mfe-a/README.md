# fe(@acme/mfe-a)

Standalone microfrontend — no cross-MFE dependencies.

Exports the standard MFE render interface:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The return value unmounts and cleans up. No framework — pure DOM.

Used by `mfe-b` as a composed dependency. Demonstrates the simplest possible `fe()` package: a self-contained module that can be developed in isolation, published independently, and composed into larger MFEs without being bundled into them.

Part of the [fe microfrontend platform](../README.md).
