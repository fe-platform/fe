# shell

Host application. Loads the platform config embedded as JSON in the HTML, then at runtime:

1. Resolves the current route to a `specifier@version`
2. Walks the transitive `fe()` dependency graph via semver
3. Injects a `<script type="importmap">` covering all resolved packages
4. Dynamically `import()`s the MFE and calls `render()`

No static import map lives in the HTML. All resolution and injection happens in the browser at load time via `platform.ts`. Multiple import maps can be injected lazily across navigations, deduped by resolved version.

Also loads `devtools` when `config.devtools` is set in `platform.json`, giving developers a floating overlay for per-tab import map overrides without touching the served build.

Part of the [fe microfrontend platform](../README.md).
