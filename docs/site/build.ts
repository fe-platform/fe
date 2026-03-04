import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const fragmentsDir = join(import.meta.dir, "fragments");
const stylesDir = join(import.meta.dir, "styles");
const templatePath = join(import.meta.dir, "index.template.html");
const outputPath = join(import.meta.dir, "index.html");
const styleOutputPath = join(import.meta.dir, "style.css");

const template = readFileSync(templatePath, "utf-8");

// Bundle HTML fragments
const fragments = readdirSync(fragmentsDir)
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => readFileSync(join(fragmentsDir, f), "utf-8"))
  .join("\n");

const output = template.replace("<!-- FRAGMENTS -->", fragments);

// Bundle CSS files
const styles = readdirSync(stylesDir)
  .filter((f) => f.endsWith(".css"))
  .sort()
  .map((f) => readFileSync(join(stylesDir, f), "utf-8"))
  .join("\n\n");

writeFileSync(outputPath, output);
writeFileSync(styleOutputPath, styles);

console.log(`built ${outputPath} using index.template.html and ${readdirSync(fragmentsDir).length} fragments`);
console.log(`built ${styleOutputPath} using ${readdirSync(stylesDir).length} style files`);
