import { join } from "path";
import type { Plugin, CliContext, BuildOptions } from "@fe/core";
import { readPackageMeta, readFeDepKeys } from "../helpers";

export const checkPlugin: Plugin = {
  name: "check",
  setup(ctx, hooks) {
    ctx.commands.set("check", {
      name: "check",
      description: "Verify configuration and buildability of an MFE or the shell",
      usage: "check <target|shell>",
      async run(args) {
        const target = args[0];
        if (!target) {
          console.error("Usage: check <target>");
          process.exit(1);
        }

        console.log(`Checking ${target}...`);
        const feConfig = await ctx.adapters.config.get();

        let dir: string;
        if (target === "shell") {
          dir = join(ctx.root, feConfig.shellDir);
        } else if (target) {
          dir = join(ctx.root, target);
        } else {
          console.error("Usage: check <target>");
          process.exit(1);
        }

        try {
          readPackageMeta(dir);
        } catch (e) {
          console.error(`Check failed: Invalid package metadata in ${dir}. Target should be a path relative to the monorepo root (e.g., sandbox/mfe-a).`);
          process.exit(1);
        }

        console.log(`- Running Typecheck`);
        const proc = Bun.spawn(["bunx", "tsc", "--noEmit", "--project", join(dir, "tsconfig.json")], {
          stdout: "inherit",
          stderr: "inherit",
        });
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          console.error(`Check failed for ${target} (TypeScript errors)`);
          process.exit(1);
        }

        console.log(`- Simulating Build`);
        const externals = readFeDepKeys(dir);

        let entrypoint = join(dir, "src", "index.ts");
        if (!(await Bun.file(entrypoint).exists())) {
          entrypoint = join(dir, "src", "index.tsx");
        }

        let options: BuildOptions = {
          entrypoints: [entrypoint],
          outdir: join(dir, "dist"),
          format: "esm",
          target: "browser",
          external: externals,
        };

        if (target === "shell") {
          options.naming = "app.js";
        }

        options = await hooks.waterfall("build:options", options);
        await hooks.callHook("build:before", target, options);

        const result = await ctx.adapters.builder.build(options);
        if (!result.success) {
          console.error(`Check failed for ${target} (Build errors)`);
          for (const log of result.logs) console.error(log);
          process.exit(1);
        }

        console.log(`Check passed for ${target} ✅`);
      },
    });
  },
};
