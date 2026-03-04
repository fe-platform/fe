import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const fragmentsDir = join(import.meta.dir, "fragments");
const outputPath = join(import.meta.dir, "index.html");

const fragments = readdirSync(fragmentsDir)
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => readFileSync(join(fragmentsDir, f), "utf-8"));

writeFileSync(outputPath, fragments.join("\n"));
console.log(`built ${outputPath} from ${fragments.length} fragments`);
