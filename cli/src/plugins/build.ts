import { join } from "path";
import type { Plugin } from "../core/plugin";
import type { CliContext } from "../core/context";
import type { Hooks } from "../core/hooks";
import type { BuildOptions, BuildResult } from "../core/types";
import { readFeDepKeys } from "../core/helpers";

// --- Hook declarations ---

declare module "../core/hooks" {
  interface HookMap {
    "build:before": [target: string, options: BuildOptions];
    "build:after": [target: string, result: BuildResult];
    "build:shell:before": [];
    "build:shell:after": [];
  }
}

// --- Public helper for other plugins (e.g. dev) ---

export async function buildTarget(ctx: CliContext, hooks: Hooks, target: string): Promise<void> {
  if (target === "shell") return buildShell(ctx, hooks);

  const dir = join(ctx.root, target);
  const externals = readFeDepKeys(dir);

  let options: BuildOptions = {
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    format: "esm",
    target: "browser",
    external: externals,
  };

  options = await hooks.waterfall("build:options", options);
  await hooks.callHook("build:before", target, options);

  const result = await ctx.adapters.builder.build(options);
  if (!result.success) {
    console.error(`Build failed for ${target}`);
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  await hooks.callHook("build:after", target, result);
  console.log(`Built ${target} → ${target}/dist/`);
}

async function buildShell(ctx: CliContext, hooks: Hooks): Promise<void> {
  const dir = join(ctx.root, "shell");
  const config = await ctx.adapters.manifest.read();

  await hooks.callHook("build:shell:before");

  let options: BuildOptions = {
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    format: "esm",
    target: "browser",
    external: readFeDepKeys(dir),
    naming: "app.js",
  };

  options = await hooks.waterfall("build:options", options);

  const result = await ctx.adapters.builder.build(options);
  if (!result.success) {
    console.error("Shell build failed");
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  // Inject platform config into the HTML template.
  // Import maps are no longer static — platform.ts injects them all at runtime.
  const template = await Bun.file(join(dir, "index.html")).text();
  const configTag = `<script id="__platform__" type="application/json">\n  ${JSON.stringify(config, null, 2)}\n  </script>`;
  const html = template.replace("<!-- __PLATFORM_CONFIG__ -->", configTag);
  await Bun.write(join(dir, "dist", "index.html"), html);

  await hooks.callHook("build:shell:after");
  console.log("Built shell → shell/dist/");
}

// --- Plugin ---

export const buildPlugin: Plugin = {
  name: "build",
  setup(ctx, hooks) {
    ctx.commands.set("build", {
      name: "build",
      description: "Build an MFE or the shell",
      usage: "build <mfe-a|mfe-b|shell>",
      async run(args) {
        const target = args[0];
        if (!target) {
          console.error("Usage: build <target>");
          process.exit(1);
        }
        await buildTarget(ctx, hooks, target);
      },
    });
  },
};
