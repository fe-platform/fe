// Usage (run from repo root):
//   bun cli/src/index.ts build <mfe-a|mfe-b|shell>
//   bun cli/src/index.ts link <consumer> <dep>      -- wire up fe: types + file: dep
//   bun cli/src/index.ts serve [port]
//   bun cli/src/index.ts dev <mfe-a|mfe-b> [port]
//   bun cli/src/index.ts admin upload <mfe-a|mfe-b>

const [, , command, ...args] = process.argv;

switch (command) {
  case "build": {
    const target = args[0];
    if (!target) { console.error("Usage: build <target>"); process.exit(1); }
    const { build } = await import("./build");
    await build(target);
    break;
  }
  case "serve": {
    const port = args[0] ? parseInt(args[0]) : 3000;
    const { serve } = await import("./serve");
    serve(port);
    break;
  }
  case "dev": {
    const target = args[0];
    const port = args[1] ? parseInt(args[1]) : 3000;
    if (!target) { console.error("Usage: dev <target> [port]"); process.exit(1); }
    const { dev } = await import("./dev");
    await dev(target, port);
    break;
  }
  case "link": {
    const consumer = args[0];
    const dep = args[1];
    if (!consumer || !dep) { console.error("Usage: link <consumer> <dep>"); process.exit(1); }
    const { link } = await import("./link");
    await link(consumer, dep);
    break;
  }
  case "admin": {
    const subcommand = args[0];
    if (subcommand === "upload") {
      const target = args[1];
      if (!target) { console.error("Usage: admin upload <target>"); process.exit(1); }
      const { adminUpload } = await import("./admin");
      adminUpload(target);
    } else {
      console.error("Unknown admin subcommand. Available: upload");
      process.exit(1);
    }
    break;
  }
  default:
    console.error("Commands: build | serve | dev | admin");
    process.exit(1);
}
