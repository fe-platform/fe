# Scenario: who microfrontends apply to

## Who this is for

Large engineering organisations where multiple teams own different parts of a
web product. The billing team, the dashboard team, and the onboarding team each
deploy on their own cadence. They share a host shell, but they cannot share a
build pipeline without creating a coordination bottleneck.

If your entire product lives in one repo and ships as one artifact, microfrontends
may add complexity without a corresponding benefit. Apply them when team ownership
boundaries are real, not speculative.

## The landscape

Several well-known approaches exist:

| Approach | What it does | Trade-off |
|---|---|---|
| iframes | Hard isolation via browser sandbox | Poor UX; no shared state |
| Module Federation (Webpack) | Shares modules across separately built apps | Couples all teams to Webpack |
| Single-SPA | Route-level orchestration | Framework-specific; complex lifecycle |
| Import map MFEs | Browser-native specifier resolution at runtime | Requires a JIT server or a CDN with correct headers |

`fe` sits in the import map camp. The browser is the runtime; the platform team
ships a JIT bundler and a loader, not a Webpack config.

## Where fe fits

`fe` is a platform toolkit, not a framework. Platform teams use it to operate the
JIT bundler and the shell. MFE teams use it to build and publish source code. The
browser wires everything together at load time using standard import maps.

The design intent is that MFE teams feel as little of the platform as possible.
Their `package.json` gets a `"fe"` key. Their `src/index.ts` exports a `render`
function. Everything else is the platform's problem.
