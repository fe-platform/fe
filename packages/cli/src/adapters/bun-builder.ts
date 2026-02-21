import type { Builder } from "@fe/core";

export function createBunBuilder(): Builder {
  return {
    async build(options) {
      const result = await Bun.build({
        entrypoints: options.entrypoints,
        outdir: options.outdir,
        format: options.format,
        target: options.target,
        external: options.external,
        naming: options.naming,
      });
      return { success: result.success, logs: result.logs };
    },
  };
}
