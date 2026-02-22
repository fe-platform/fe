---
sidebar_position: 3
---

# MFE Interface

Every MFE exports a single `render()` function. The return value unmounts and cleans up. Any framework is supported — the contract is framework-agnostic.

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

<!-- TODO: Explain the render contract in depth, show examples with React/Solid/vanilla DOM, explain cleanup semantics, and how the host never knows what framework rendered into the container. -->
