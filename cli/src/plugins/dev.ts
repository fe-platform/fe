import { join } from "path";
import type { Plugin } from "../core/plugin";
import { readPackageMeta } from "../core/helpers";
import { buildTarget } from "./build";

// --- Hook declarations ---

declare module "../core/hooks" {
  interface HookMap {
    "dev:start": [target: string, port: number];
    "dev:rebuild": [target: string];
    "dev:reload": [];
  }
}

// --- SSE infrastructure ---

const SSE_PATH = "/__dev";
const sseClients = new Set<ReadableStreamDefaultController>();

function notifyReload(): void {
  const payload = `data: ${JSON.stringify({ t: Date.now() })}\n\n`;
  for (const ctrl of sseClients) {
    try {
      ctrl.enqueue(payload);
    } catch {
      sseClients.delete(ctrl);
    }
  }
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
    // HMR: on rebuild, swap the module in-place without a full page reload.
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

// --- Plugin ---

export const devPlugin: Plugin = {
  name: "dev",
  setup(ctx, hooks) {
    ctx.commands.set("dev", {
      name: "dev",
      description: "Dev server with hot reload",
      usage: "dev <target> [port=3000]",
      async run(args) {
        const target = args[0];
        const port = args[1] ? parseInt(args[1]) : 3000;
        if (!target) {
          console.error("Usage: dev <target> [port]");
          process.exit(1);
        }

        const dir = join(ctx.root, target);
        const { name } = readPackageMeta(dir);
        const distDir = join(dir, "dist");

        await buildTarget(ctx, hooks, target);
        console.log(`Dev server: http://localhost:${port}`);

        Bun.serve({
          port,
          async fetch(req) {
            const url = new URL(req.url);

            if (url.pathname === SSE_PATH) {
              let ctrl!: ReadableStreamDefaultController;
              const stream = new ReadableStream({
                start(c) { ctrl = c; sseClients.add(c); },
                cancel() { sseClients.delete(ctrl); },
              });
              return new Response(stream, {
                headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
              });
            }

            if (url.pathname === "/" || url.pathname === "/index.html") {
              return new Response(sandboxHtml(name), { headers: { "Content-Type": "text/html" } });
            }

            const file = Bun.file(join(distDir, url.pathname));
            if (await file.exists()) return new Response(file);
            return new Response("Not found", { status: 404 });
          },
        });

        await hooks.callHook("dev:start", target, port);

        const watcher = Bun.watch(join(dir, "src"), { recursive: true });
        for await (const _event of watcher) {
          process.stdout.write(`Rebuilding ${target}... `);
          await hooks.callHook("dev:rebuild", target);
          await buildTarget(ctx, hooks, target);
          notifyReload();
          await hooks.callHook("dev:reload");
          console.log("done.");
        }
      },
    });
  },
};
