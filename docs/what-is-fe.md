# What is fe

## What problem it solves

Frontend teams working in isolation produce their own build tooling, their own
deployment pipelines, and their own import strategies. When those teams need to
share a shell, the seams show: version conflicts, duplicated dependencies, and
no agreed-upon contract for how a microfrontend mounts and unmounts.

`fe` prescribes a minimal contract and handles the plumbing:

- A MFE exports one function: `render(container, props): () => void`.
- MFE teams publish source code, not bundles.
- The platform JIT-compiles source on first request and caches the result.
- The browser resolves inter-MFE dependencies through import maps at runtime.

## Your investment to adopt fe

To adopt `fe` as your platform, you commit to:

- A host shell that loads `@fe/runtime` and calls `load(path)` on navigation.
- A server running `fe serve`, which houses the JIT bundler.
- A `platform.json` manifest that maps routes and package versions.
- MFE teams using `fe new` to scaffold projects and `fe publish` to deploy.

You do not commit to a specific framework. React MFEs and Solid.js MFEs coexist
in the same shell, each compiled by the appropriate JIT plugin.

## What you will get

- Independent deployment per MFE: publish without touching other teams.
- JIT compilation on the server: no build step in the production deploy path.
- Dev overrides via sessionStorage: point any specifier at a local dev URL without
  redeploying anything, and share that override via a URL param.
- A CLI that covers the full lifecycle: scaffold, build, link, check, dev, publish.
