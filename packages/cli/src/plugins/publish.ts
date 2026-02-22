import { join } from "path";
import type { Plugin, PackageVersion } from "@fe/core";
import { readPackageMeta, readFeDeps, slugFromSpecifier } from "../helpers";

/**
 * `fe publish <target>`
 *
 * Uploads the raw source of an MFE (its `src/` directory and `package.json`)
 * to the configured SourceStorage adapter. No compilation step.
 *
 * Pre-flight: verifies the source *can* compile before allowing the upload
 * so that broken code never reaches the JIT bundler.
 *
 * The JIT bundler in `@fe/runtime` will compile the source on first request
 * and cache the result. Organizations can swap the default local SourceStorage
 * for S3, Cloudflare R2, or any CDN-backed adapter via plugins.
 *
 * Future: auth / signing will be layered here without changing the interface.
 */
export const publishPlugin: Plugin = {
  name: "publish",
  setup(ctx, hooks) {
    ctx.commands.set("publish", {
      name: "publish",
      description: "Publish MFE source for JIT compilation",
      usage: "publish <target>",
      async run(args) {
        const target = args[0];
        if (!target) {
          console.error("Usage: fe publish <target>");
          process.exit(1);
        }
        await publish(ctx, hooks, target);
      },
    });
  },
};

async function publish(
  ctx: import("@fe/core").CliContext,
  hooks: import("@fe/core").Hooks,
  target: string,
): Promise<void> {
  const dir = join(ctx.root, target);
  const srcDir = join(dir, "src");

  // --- Pre-flight: ensure the source compiles without errors ---
  console.log(`[fe publish] Pre-flight type-check for ${target}...`);
  const dryRun = await ctx.adapters.builder.build({
    entrypoints: [join(srcDir, "index.ts")],
    outdir: "/dev/null",
    format: "esm",
    target: "browser",
    external: [],
  });
  if (!dryRun.success) {
    console.error(`[fe publish] Pre-flight failed — fix build errors before publishing.`);
    for (const log of dryRun.logs) console.error(log);
    process.exit(1);
  }

  const { name, version } = readPackageMeta(dir);
  const slug = slugFromSpecifier(name);

  await hooks.callHook("publish:before", target, { name, version });

  // --- Upload raw source files ---
  const storedBase = await ctx.adapters.sourceStorage.upload(slug, version, srcDir);

  // The URL registered in the manifest points to the JIT bundler route.
  // The runtime builds an import map URL like: /bundle/<slug>/<version>/index.ts
  const bundleUrl = `/bundle/${slug}/${version}/index.ts`;

  // --- Resolve fe() devDependencies for the manifest entry ---
  const rawFeDeps = readFeDeps(dir);
  const deps: Record<string, string> = {};
  for (const depSpecifier of Object.keys(rawFeDeps)) {
    const depSlug = slugFromSpecifier(depSpecifier);
    const depDir = join(ctx.root, depSlug);
    try {
      const depMeta = readPackageMeta(depDir);
      deps[depSpecifier] = `^${depMeta.version}`;
    } catch {
      console.warn(`  Warning: could not resolve version for ${depSpecifier}, skipping dep.`);
    }
  }

  const entry: PackageVersion = { url: bundleUrl, deps };
  await hooks.callHook("publish:register:before", name, version, entry);
  await ctx.adapters.manifest.registerPackage(name, version, entry);
  await hooks.callHook("publish:register:after");
  await hooks.callHook("publish:after", target, bundleUrl, deps);

  console.log(`Published ${name}@${version}`);
  console.log(`Source stored at: ${storedBase}`);
  console.log(`Bundle route:     ${bundleUrl}`);
  console.log(`Deps: ${Object.keys(deps).length === 0 ? "(none)" : Object.keys(deps).join(", ")}`);
  console.log(`\nRegistered in manifest. Update "routes" to activate for a path.`);
}
