import { join } from "path";
import type { Plugin } from "@fe/core";
import { createJITBundler } from "@fe/compiler";

export const servePlugin: Plugin = {
  name: "serve",
  setup(ctx, hooks) {
    ctx.commands.set("serve", {
      name: "serve",
      description: "Serve the built shell with integrated JIT MFE bundler",
      usage: "serve [port=3000]",
      async run(args) {
        const port = args[0] ? parseInt(args[0]) : 3000;
        const feConfig = await ctx.adapters.config.get();
        const distDir = join(ctx.root, feConfig.shellDir, "dist");
        const uploadsDir = join(ctx.root, feConfig.uploadsDir);

        // JIT bundler is automatically initialized and mounted — no setup needed by the shell author.
        const jit = createJITBundler({ storage: ctx.adapters.sourceStorage });

        Bun.serve({
          port,
          async fetch(req) {
            await hooks.callHook("serve:request", req);

            // 1. Let the JIT bundler handle /bundle/* requests first
            const jitResponse = await jit.handle(req);
            if (jitResponse) return jitResponse;

            const url = new URL(req.url);
            let pathname = url.pathname === "/" ? "/index.html" : url.pathname;

            // 2. Serve pre-built artifacts (legacy / fe admin upload compat)
            if (pathname.startsWith(`/${feConfig.uploadsDir}/`)) {
              const file = Bun.file(join(ctx.root, pathname.slice(1)));
              if (await file.exists()) return new Response(file);
              return new Response("Not found", { status: 404 });
            }

            // 3. Serve shell dist files (HTML, platform.js, etc.)
            const file = Bun.file(join(distDir, pathname));
            if (await file.exists()) return new Response(file);
            return new Response("Not found", { status: 404 });
          },
        });

        await hooks.callHook("serve:start", port);
        console.log(`Serving at http://localhost:${port}`);
        console.log(`JIT bundler active at /bundle/`);
        console.log(`Uploads served from: ${uploadsDir}`);
      },
    });
  },
};
