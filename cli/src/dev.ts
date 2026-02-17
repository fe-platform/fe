import { join } from "path";
import { ROOT, readPackageMeta } from "./config";
import { build } from "./build";

// Hot reload story: dead simple.
// 1. Bun watches src/ for changes and rebuilds.
// 2. A Server-Sent Events (SSE) endpoint notifies the browser.
// 3. The browser does location.reload() — no runtime, no module graph tricks.
// Import maps are static once parsed, so a full reload is the only clean option.
// With Bun's build speed, this feels instant.

const SSE_PATH = "/__dev";
const sseClients = new Set<ReadableStreamDefaultController>();

function notifyReload(): void {
  for (const ctrl of sseClients) {
    try { ctrl.enqueue("data: reload\n\n"); } catch { sseClients.delete(ctrl); }
  }
}

// Minimal sandbox HTML served at "/" for isolated MFE development.
// The import map points fe:<name> to the locally built /index.js.
function sandboxHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>dev: ${name}</title>
  <script type="importmap">
  { "imports": { "fe:${name}": "/index.js" } }
  </script>
</head>
<body>
  <div id="sandbox" style="padding:16px"></div>
  <script type="module">
    import { render } from "fe:${name}";
    render(document.getElementById("sandbox"), {});
  </script>
  <!-- SSE-based hot reload: no runtime, just a full page reload on rebuild. -->
  <script>new EventSource("${SSE_PATH}").onmessage = () => location.reload();</script>
</body>
</html>`;
}

export async function dev(target: string, port = 3000): Promise<void> {
  const dir = join(ROOT, target);
  const { name } = readPackageMeta(dir);
  const distDir = join(dir, "dist");

  await build(target);
  console.log(`Dev server: http://localhost:${port}`);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // SSE endpoint — keep connection open, push "reload" on each file change.
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

      // Serve the sandbox HTML at root.
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(sandboxHtml(name), { headers: { "Content-Type": "text/html" } });
      }

      // Serve built files from dist/.
      const file = Bun.file(join(distDir, url.pathname));
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    },
  });

  // File watcher: rebuild on any src change, then notify SSE clients.
  const watcher = Bun.watch(join(dir, "src"), { recursive: true });
  for await (const _event of watcher) {
    process.stdout.write(`Rebuilding ${target}... `);
    await build(target);
    notifyReload();
    console.log("done.");
  }
}
