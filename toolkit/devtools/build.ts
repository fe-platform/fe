import { SolidPlugin } from "@dschz/bun-plugin-solid";

const result = await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  format: "esm",
  target: "browser",
  external: ["fe(*)", /^fe\(/],
  plugins: [SolidPlugin({ generate: "dom", hydratable: false, sourceMaps: false })],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
