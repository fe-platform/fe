# ⚯ packages/jit-plugin-react/ · agent-ref
↑ /AGENTS.md for repo-wide context
↑ packages/core/AGENTS.md for JitPlugin interface

## purpose
`@fe/jit-plugin-react` v0.1.0 — JIT plugin for React MFEs.
Published. Add to `FeConfig.jitPlugins` in `fe-config.json` to enable explicit React mode.

## what it does
Bun resolves React JSX natively via tsconfig `"jsx": "react-jsx"`. This plugin:
- Sets `options.plugins` to `[]` (or preserves the existing array if already set).
- Disables `@fe/compiler`'s Solid.js auto-detection for the current build.

When `options.plugins` is set (even to `[]`), `compileMfe` skips auto-detection entirely,
ensuring React MFEs are not accidentally compiled with `bun-plugin-solid`.

## src/index.ts
```ts
const jitPlugin: JitPlugin = {
  transform(options: BuildOptions): BuildOptions {
    return { ...options, plugins: options.plugins ?? [] };
  },
};
export default jitPlugin;
export { jitPlugin };
```

## usage
```json
// configs/fe-config.json
{ "jitPlugins": ["@fe/jit-plugin-react"] }
```

## invariants
- exports default and named `jitPlugin` (bootstrap validates either)
- no dependencies beyond @fe/core; React JSX support is built into Bun
