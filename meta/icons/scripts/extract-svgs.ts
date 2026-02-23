import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const icons = JSON.parse(readFileSync(join(rootDir, 'node_modules/@iconify-json/streamline/icons.json'), 'utf-8'));

const srcDir = join(rootDir, 'src');
mkdirSync(srcDir, { recursive: true });

const iconEntries = Object.entries(icons.icons);

for (const [name, data] of iconEntries) {
  const icon = data as { body: string; width?: number; height?: number };
  const width = icon.width || 28;
  const height = icon.height || 28;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`;
  
  writeFileSync(join(srcDir, `${name}.svg`), svg);
}

console.log(`Generated ${iconEntries.length} SVG files in src/`);
