import type { Builder } from "../core/adapters";
import type { BuildOptions, BuildResult } from "../core/types";

export function createBunBuilder(): Builder {
  return {
    async build(options: BuildOptions): Promise<BuildResult> {
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
