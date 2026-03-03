import type { Builder, BuildOptions } from "@fe/core";
import { compileMfe } from "@fe/compiler";

async function bunBuild(options: BuildOptions): Promise<{ success: boolean; logs: unknown[] }> {
  const result = await compileMfe({
    entrypoints: options.entrypoints,
    outdir: options.outdir,
    external: options.external,
    rootDir: options.rootDir ?? process.cwd(),
    naming: options.naming,
    plugins: options.plugins,
  });
  return { success: result.success, logs: result.logs };
}

export function createBunBuilder(): Builder {
  return { build: bunBuild };
}
