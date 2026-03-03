# What the future can hold

This section describes intent and prediction, not commitment.

## MFE registry tied to JSR

The current manifest is a hand-maintained JSON file. A natural evolution is a
central registry where `fe publish` pushes to a versioned store (analogous to
JSR or npm) and the runtime fetches the manifest from a well-known URL rather
than from an embedded script tag.

Publishing to a shared registry also opens the door to discovery: an organisation's
MFE catalogue becomes queryable, and dependency graphs become visible across teams.

## MFEs exporting more than render

Today every MFE must export `render(container, props): () => void`. That contract
is deliberately minimal. A richer contract might allow MFEs to export additional
named functions: a `prefetch` hint, a server-side render function, or a data loader
that the shell can call before mounting.

Any extension of the contract needs to remain backwards-compatible: existing MFEs
that export only `render` must continue to work.

## More out-of-the-box tooling

The `toolkit/` directory intends to grow. Likely candidates:

- Framework glue packages (`react-glue`, `solid-glue`) that wrap `fe(acme/store)`
  and `fe(acme/network)` into framework-native hooks and signals. These live in
  toolkit rather than in the framework packages so the framework dependency stays
  lazy (see the lazy import convention in AGENTS.md).
- An auth primitive that provides a shared identity context across MFEs.
- A feature-flag primitive backed by `fe(acme/store)`.

## Shared automation and testing

Cross-MFE integration testing is currently out of scope. A plausible path is a
Playwright harness that boots `fe serve`, drives the shell through a test
browser, and verifies that MFEs mount, interact, and unmount correctly.

Shared contract tests (does this MFE still export `render`?) could run in CI
against every published version without spinning up a full browser.
