import { join } from "path";
import { watch } from "fs";
import type { Plugin, CliContext, Hooks } from "@fe/core";
import { readPackageMeta } from "../helpers";
import { buildTarget } from "./build";

const SSE_PATH = "/__dev";
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };
const sseClients = new Set<ReadableStreamDefaultController>();
let pendingTs: number | null = null;

function notifyReload(): void {
  pendingTs = Date.now();
  const payload = `data: ${JSON.stringify({ t: pendingTs })}\n\n`;
  for (const ctrl of sseClients) {
    try { ctrl.enqueue(payload); } catch { sseClients.delete(ctrl); }
  }
}

function drainPending(ctrl: ReadableStreamDefaultController): void {
  if (pendingTs === null) return;
  try { ctrl.enqueue(`data: ${JSON.stringify({ t: pendingTs })}\n\n`); } catch { /* gone */ }
}

function sandboxHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>dev: ${name}</title>
  <script type="importmap">
  { "imports": { "${name}": "/index.js" } }
  </script>
</head>
<body>
  <div id="sandbox" style="padding:16px"></div>
  <script type="module">
    import { render } from "${name}";
    let unmount = render(document.getElementById("sandbox"), {});
    new EventSource("${SSE_PATH}").onmessage = async (e) => {
      const { t } = JSON.parse(e.data);
      const mod = await import("/index.js?t=" + t);
      unmount?.();
      unmount = mod.render(document.getElementById("sandbox"), {});
    };
  </script>
</body>
</html>`;
}

async function devFetch(req: Request, distDir: string, name: string): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === SSE_PATH) {
    let ctrl!: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(c) { ctrl = c; sseClients.add(c); drainPending(c); },
      cancel() { sseClients.delete(ctrl); },
    });
    return new Response(stream, {
      headers: { ...CORS_HEADERS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(sandboxHtml(name), { headers: { ...CORS_HEADERS, "Content-Type": "text/html" } });
  }

  const file = Bun.file(join(distDir, url.pathname));
  if (await file.exists()) return new Response(file, { headers: CORS_HEADERS });
  return new Response("Not found", { status: 404, headers: CORS_HEADERS });
}

async function devWatchRebuild(ctx: CliContext, hooks: Hooks, target: string, shellDir: string): Promise<void> {
  process.stdout.write(`Rebuilding ${target}... `);
  await hooks.callHook("dev:rebuild", target);
  await buildTarget(ctx, hooks, target, shellDir);
  notifyReload();
  await hooks.callHook("dev:reload");
  console.log("done.");
}

async function runDev(ctx: CliContext, hooks: Hooks, args: string[]): Promise<void> {
  const target = args[0];
  const port = args[1] ? parseInt(args[1]) : 3000;
  if (!target) {
    console.error("Usage: dev <target> [port]");
    process.exit(1);
  }

  const feConfig = await ctx.adapters.config.get();
  const dir = join(ctx.root, target);
  const { name } = readPackageMeta(dir);
  const distDir = join(dir, "dist");

  await buildTarget(ctx, hooks, target, feConfig.shellDir);
  console.log(`Dev server: http://localhost:${port}`);

  Bun.serve({
    port,
    fetch: (req) => devFetch(req, distDir, name),
  });

  await hooks.callHook("dev:start", target, port);

  watch(join(dir, "src"), { recursive: true }, () => {
    devWatchRebuild(ctx, hooks, target, feConfig.shellDir);
  });
}

function setupDev(ctx: CliContext, hooks: Hooks): void {
  ctx.commands.set("dev", {
    name: "dev",
    description: "Dev server with hot reload",
    usage: "dev <target> [port=3000]",
    run: (args) => runDev(ctx, hooks, args),
  });
}

export const devPlugin: Plugin = {
  name: "dev",
  setup: setupDev,
};
