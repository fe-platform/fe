# ⚯ toolkit/store/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:      @acme/fe.store
version:   1.0.0
module:    src/index.ts
MFE-deps: ∅  (no external MFE imports)
dependencies: ∅  (zero runtime deps)
```

## purpose
Framework-agnostic cross-MFE state primitive. MFEs import it as an MFE dependency;
the import map ensures all MFEs share a single module instance, and therefore a single
store registry.

Glue packages (react-glue, solid-glue, etc.) adapt these stores into framework-native
hooks or signals. Framework adapters belong in the glue package, not here.

## API (src/index.ts)
```ts
createStore<T>(key: string, init: T): Store<T>
  Returns the store registered under `key`, creating it with `init` on first call.
  Subsequent calls with the same key return the existing store.

getStore<T>(key: string): Store<T> | null
  Returns an existing store or null. Does not create a store.

interface Store<T> {
  get(): T
  set(updater: T | ((prev: T) => T)): void
  subscribe(listener: (value: T) => void): () => void  // returns unsubscribe fn
}
```

## usage in an MFE
```ts
import { createStore } from "@acme/fe.store";

const auth = createStore("auth", { user: null });

auth.subscribe((val) => console.log("auth changed:", val));
auth.set({ user: { id: "u1" } });
```

## deploy flow
```
fe build toolkit/store  → dist/index.js
fe admin upload toolkit/store
  copies dist/ → uploads/store/1.0.0/
  registers in platform.json packages section

# After upload, any MFE can declare it as a devDependency:
fe link <mfe-dir> toolkit/store
```

## invariants
- no framework dependencies; zero runtime deps
- module-level registry: all stores are global to the page
- set() is a no-op when the new value is reference-equal to the previous
- subscribe() listeners are called synchronously after set()
