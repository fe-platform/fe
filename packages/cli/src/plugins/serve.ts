import { join } from "path";
import type { Plugin } from "@fe/core";

export const servePlugin: Plugin = {
  name: "serve",
  setup(ctx, hooks) {
    ctx.commands.set("serve", {
      name: "serve",
      description: "Serve the built shell",
      usage: "serve [port=3000]",
      async run(args) {
        const port = args[0] ? parseInt(args[0]) : 3000;
        const { readFeConfig } = await import("../config");
        const feConfig = readFeConfig(ctx.root);
        const distDir = join(ctx.root, feConfig.shellDir, "dist");
        const uploadsDir = join(ctx.root, feConfig.uploadsDir);

        Bun.serve({
          port,
          async fetch(req) {
            await hooks.callHook("serve:request", req);

            const url = new URL(req.url);
            let pathname = url.pathname === "/" ? "/index.html" : url.pathname;

            if (pathname.startsWith(`/${feConfig.uploadsDir}/`)) {
              const file = Bun.file(join(ctx.root, pathname.slice(1)));
              if (await file.exists()) return new Response(file);
              return new Response("Not found", { status: 404 });
            }

            const file = Bun.file(join(distDir, pathname));
            if (await file.exists()) return new Response(file);
            return new Response("Not found", { status: 404 });
          },
        });

        await hooks.callHook("serve:start", port);
        console.log(`Serving at http://localhost:${port}`);
        console.log(`Uploads served from: ${uploadsDir}`);
      },
    });
  },
};
