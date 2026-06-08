import { join } from "path";
import type { Plugin, CliContext, Hooks } from "@fe/core";
import { createJITBundler } from "@fe/compiler";

async function serveFetch(
  req: Request,
  jit: { handle: (req: Request) => Promise<Response | null> },
  root: string,
  distDir: string,
  uploadsPrefix: string,
): Promise<Response> {
  const jitResponse = await jit.handle(req);
  if (jitResponse) return jitResponse;

  const url = new URL(req.url);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

  if (pathname.startsWith(`/${uploadsPrefix}/`)) {
    const file = Bun.file(join(root, pathname.slice(1)));
    if (await file.exists()) return new Response(file);
    return new Response("Not found", { status: 404 });
  }

  const file = Bun.file(join(distDir, pathname));
  if (await file.exists()) return new Response(file);
  return new Response("Not found", { status: 404 });
}

async function runServe(ctx: CliContext, hooks: Hooks, args: string[]): Promise<void> {
  const port = args[0] ? parseInt(args[0]) : 3000;
  const feConfig = await ctx.adapters.config.get();
  const distDir = join(ctx.root, feConfig.shellDir, "dist");
  const uploadsDir = join(ctx.root, feConfig.uploadsDir);

  const jit = createJITBundler({
    storage: ctx.adapters.sourceStorage,
    jitPlugins: ctx.jitPlugins,
  });

  Bun.serve({
    port,
    fetch: (req) => serveFetch(req, jit, ctx.root, distDir, feConfig.uploadsDir),
  });

  console.log(`Serving at http://localhost:${port}`);
  console.log(`JIT bundler active at /bundle/`);
  console.log(`Uploads served from: ${uploadsDir}`);
}

function setupServe(ctx: CliContext, hooks: Hooks): void {
  ctx.commands.set("serve", {
    name: "serve",
    description: "Serve the built shell with integrated JIT MFE bundler",
    usage: "serve [port=3000]",
    run: (args) => runServe(ctx, hooks, args),
  });
}

export const servePlugin: Plugin = {
  name: "serve",
  setup: setupServe,
};
