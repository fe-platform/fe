# fe(acme/devtools)

Developer overlay MFE. Renders a floating panel for managing per-tab import map overrides: swap any `fe()` package's resolved URL without redeploying or restarting anything.

Built with Solid.js (bundled internally, the one exception to the no-framework rule). Loaded by the shell when `config.devtools` is set in `platform.json`. Not published via `routes`; activated by pointing the `devtools` key in the config directly to its artifact URL.

Overrides are stored in `sessionStorage` and applied by the shell's `platform.ts` before import map injection on the next page load. A share button encodes the current overrides as a URL parameter so they can be handed to other tabs or team members.

Part of the [fe microfrontend platform](../README.md).
