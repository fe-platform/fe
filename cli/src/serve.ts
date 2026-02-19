import { join } from "path";
import { ROOT } from "./config";

// Serves the built shell from shell/dist/ on a local HTTP server.
// Run `bun cli/src/index.ts build shell` first.
export function serve(port = 3000): void {
  const distDir = join(ROOT, "shell", "dist");
  const uploadsDir = join(ROOT, "uploads");

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      let pathname = url.pathname === "/" ? "/index.html" : url.pathname;

      // Serve upload artifacts (referenced by import map) under /uploads/.
      if (pathname.startsWith("/uploads/")) {
        const file = Bun.file(join(ROOT, pathname.slice(1)));
        if (await file.exists()) return new Response(file);
        return new Response("Not found", { status: 404 });
      }

      const file = Bun.file(join(distDir, pathname));
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`Serving shell at http://localhost:${port}`);
  console.log(`Uploads served from: ${uploadsDir}`);
}
