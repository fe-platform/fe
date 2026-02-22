---
sidebar_position: 1
slug: /
---

# Introduction

The web already has everything needed to run independent modules. `fe` uses this built-in power with the intent of providing a natural developer experience. Inspired by the web community, module federation, and [1fe](https://1fe.com/), the goal of this platform is a return to simple code.

Using three basic web features, `fe` makes microfrontends accessible for developers of any skill level:
1. **Native ES Modules**: Provide comfortable, safe code separation.
2. **Import Maps**: Turn simple names into direct URLs in the browser.
3. **Dynamic `import()`**: Load code smoothly when needed.

## How It Works

The system runs in three steps:
- **Build:** Independent modules are built. Links to other modules are gracefully left open to be connected later.
- **Deploy:** Modules are uploaded. Data about the module (its URL and links) is saved in the platform.
- **Run:** The browser safely connects the links using import maps and loads everything naturally.

Code modules stay respectfully separate. This holds true in development, testing, and live use.

## The `fe()` Naming Rule

```ts
import { render } from "fe(@acme/mfe-a)";
```

`fe(@acme/mfe-a)` acts as the exact name in `package.json`, the import link, and the record key. The `fe(` start tells the builder to keep the code separate automatically.

## The Design Promise

Each module works happily alone and exports exactly one function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The main app calls `render()`, gets a function to gently clean up, and welcomes any framework used inside. This shared agreement honors clean code separate from the main app.

## Next Steps

- **[Getting Started](./getting-started/installation.md)**: Install the tool, make your first module, and link them together.
- **[Architecture](./architecture/overview.md)**: Read about the full system design and how code connects live.

> *Heavily influenced by and borrows concepts from the MFE architecture described at [1fe.com](https://1fe.com/).*
