import { join } from "path";
import type { Plugin } from "../core/plugin";

// --- Hook declarations ---

declare module "../core/hooks" {
  interface HookMap {
    "serve:start": [port: number];
    "serve:request": [req: Request];
  }
}

// --- Plugin ---

export const servePlugin: Plugin = {
  name: "serve",
  setup(ctx, hooks) {
    ctx.commands.set("serve", {
      name: "serve",
      description: "Serve the built shell",
      usage: "serve [port=3000]",
      async run(args) {
        const port = args[0] ? parseInt(args[0]) : 3000;
        const distDir = join(ctx.root, "shell", "dist");
        const uploadsDir = join(ctx.root, "uploads");

        Bun.serve({
          port,
          async fetch(req) {
            await hooks.callHook("serve:request", req);

            const url = new URL(req.url);
            let pathname = url.pathname === "/" ? "/index.html" : url.pathname;

            if (pathname.startsWith("/uploads/")) {
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
        console.log(`Serving shell at http://localhost:${port}`);
        console.log(`Uploads served from: ${uploadsDir}`);
      },
    });
  },
};
