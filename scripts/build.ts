#!/usr/bin/env bun

/**
 * Universal build script for FE platform packages.
 * Bundles source code and generates TypeScript declarations.
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface BuildOptions {
  entrypoint: string;
  outdir: string;
  target?: "node" | "browser";
  generateTypes?: boolean;
}

async function build(options: BuildOptions): Promise<void> {
  const { entrypoint, outdir, target = "node", generateTypes = true } = options;

  console.log(`Building ${entrypoint}...`);

  // Bundle with Bun
  await Bun.build({
    entrypoints: [entrypoint],
    outdir,
    target,
    minify: false,
    sourcemap: "external",
  });

  console.log(`✓ Bundled to ${outdir}`);

  // Generate TypeScript declarations
  if (generateTypes) {
    const pkgDir = join(process.cwd());
    const tsconfigPath = join(pkgDir, "tsconfig.json");

    if (existsSync(tsconfigPath)) {
      console.log("Generating type declarations...");
      await $`tsc --emitDeclarationOnly --declaration --declarationMap`;
      console.log("✓ Type declarations generated");
    }
  }
}

// CLI usage
if (import.meta.main) {
  const entrypoint = process.argv[2] || "./src/index.ts";
  const outdir = process.argv[3] || "./dist";

  await build({
    entrypoint,
    outdir,
    generateTypes: true,
  });
}

export { build };
