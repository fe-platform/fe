---
sidebar_position: 1
---

# Dev Workflow

Isolated MFE development with `fe dev`, hot module replacement via SSE, and the rebuild cycle.

## Starting the Dev Server

```bash
fe dev sandbox/mfe-a
```

`fe dev` builds the target MFE, starts a local HTTP server, and watches `src/` for changes. Open the URL it prints (typically `http://localhost:3000`) and you see a minimal sandbox page with your MFE rendered into it.

To use a different port:

```bash
fe dev sandbox/mfe-a 4000
```

## What the Sandbox Serves

The dev server exposes three endpoints:

| Path | Response |
|------|----------|
| `/` | Minimal HTML with an inline import map and a `<div id="sandbox">` |
| `/index.js` | The built output of your MFE's `src/index.ts` |
| `/__dev` | Server-Sent Events stream for rebuild notifications |

The import map maps your MFE's specifier to `/index.js`:

```json
{ "imports": { "fe(@acme/mfe-a)": "/index.js" } }
```

The sandbox page calls `render(container, {})` on page load. You see your MFE.

## Hot Module Replacement

When you save a file in `src/`, the server:

1. Triggers a Bun rebuild (typically sub-100ms for small MFEs).
2. Stores the completed rebuild's timestamp in `pendingTs`.
3. Sends `data: {"t": <timestamp>}` over the SSE stream to every connected tab.

The browser handles the notification by:

1. Calling the current unmount function (the return value of the last `render` call).
2. Importing `/index.js?t=<timestamp>`. The cache-busting query parameter forces the browser to treat this as a new module URL, bypassing the native module registry.
3. Calling `render` with the fresh module.

No page reload. No framework-specific hot reload plugin. The `render`/unmount contract is the HMR protocol.

## Reconnecting Tabs

If a tab loses the SSE connection and reconnects (after a network hiccup or sleeping the laptop, for example), the server immediately sends the current `pendingTs` value. The tab applies the latest rebuild without missing anything that happened while it was disconnected.

## Limitations of Dev Mode

The dev sandbox's import map only contains your MFE's specifier. If your MFE imports other `fe()` dependencies (as `mfe-b` imports `mfe-a`), those specifiers are not in the map and the browser cannot resolve them.

To develop an MFE that composes others, publish the dependencies first and use `fe serve` instead of `fe dev`:

```bash
fe publish sandbox/mfe-a
fe build shell
fe serve
```

Then edit `sandbox/mfe-b/src/` and run `fe publish sandbox/mfe-b` each time you want to test the composed result.
