import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const fragmentsDir = join(import.meta.dir, "fragments");
const templatePath = join(import.meta.dir, "index.template.html");
const outputPath = join(import.meta.dir, "index.html");

const template = readFileSync(templatePath, "utf-8");

const fragments = readdirSync(fragmentsDir)
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => readFileSync(join(fragmentsDir, f), "utf-8"))
  .join("\n");

const output = template.replace("<!-- FRAGMENTS -->", fragments);

writeFileSync(outputPath, output);
console.log(`built ${outputPath} using index.template.html and ${readdirSync(fragmentsDir).length} fragments`);
