import type { Builder } from "@fe/core";
import { compileMfe } from "@fe/compiler";

export function createBunBuilder(): Builder {
  return {
    async build(options) {
      const result = await compileMfe({
        entrypoints: options.entrypoints,
        outdir: options.outdir,
        external: options.external,
        rootDir: options.rootDir ?? process.cwd(),
        naming: options.naming,
      });
      return { success: result.success, logs: result.logs };
    },
  };
}
