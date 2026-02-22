import { join } from "path";
import type { Plugin, CliContext, BuildOptions, BuildResult } from "@fe/core";
import type { Hooks } from "@fe/core";
import { readFeDepKeys } from "../helpers";

export async function buildTarget(ctx: CliContext, hooks: Hooks, target: string, shellDir: string): Promise<void> {
  if (target === "shell") return buildShell(ctx, hooks, shellDir);

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

async function buildShell(ctx: CliContext, hooks: Hooks, shellDir: string): Promise<void> {
  const dir = join(ctx.root, shellDir);
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

  const template = await Bun.file(join(dir, "index.html")).text();
  const configTag = `<script id="__platform__" type="application/json">\n  ${JSON.stringify(config, null, 2)}\n  </script>`;
  const html = template.replace("<!-- __PLATFORM_CONFIG__ -->", configTag);
  await Bun.write(join(dir, "dist", "index.html"), html);

  await hooks.callHook("build:shell:after");
  console.log(`Built shell → ${shellDir}/dist/`);
}

export const buildPlugin: Plugin = {
  name: "build",
  setup(ctx, hooks) {
    ctx.commands.set("build", {
      name: "build",
      description: "Build an MFE or the shell",
      usage: "build <target|shell>",
      async run(args) {
        const target = args[0];
        if (!target) {
          console.error("Usage: build <target>");
          process.exit(1);
        }
        const feConfig = await ctx.adapters.config.get();
        await buildTarget(ctx, hooks, target, feConfig.shellDir);
      },
    });
  },
};
