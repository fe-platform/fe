import type { JitPlugin, BuildOptions } from "@fe/core";
import { SolidPlugin } from "bun-plugin-solid";

const jitPlugin: JitPlugin = {
  transform(options: BuildOptions): BuildOptions {
    return {
      ...options,
      plugins: [...(options.plugins ?? []), SolidPlugin()],
    };
  },
};

export default jitPlugin;
export { jitPlugin };
