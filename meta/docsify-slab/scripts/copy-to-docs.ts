import { copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const src = resolve(dir, "../theme.css");
const dest = resolve(dir, "../../../docs/style.css");

copyFileSync(src, dest);
console.log(`copied theme.css → docs/style.css`);
