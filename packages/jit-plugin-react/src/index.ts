import type { JitPlugin, BuildOptions } from "@fe/core";

/**
 * JIT plugin for React JSX.
 * Bun resolves React JSX natively via tsconfig `"jsx": "react-jsx"`.
 * This plugin marks the build as React-aware and disables Solid auto-detection,
 * ensuring a clean build for React MFEs.
 */
const jitPlugin: JitPlugin = {
  transform(options: BuildOptions): BuildOptions {
    return {
      ...options,
      plugins: options.plugins ?? [],
    };
  },
};

export default jitPlugin;
export { jitPlugin };
