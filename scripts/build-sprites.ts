/**
 * Builds public/assets/sprites.png and public/assets/sprites.json from the pixel
 * matrices in src/art/sprites. Run with `npm run sprites` (Vite runs it too).
 * Fails loudly if any sprite has a wrong size or a colour outside the palette.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITES } from '../src/art/sprites/index.ts';
import { layoutSheet, rasterize, spritesheetJson, validateSprites } from '../src/art/sheet.ts';
import { encodePng } from './png.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets');

const errors = validateSprites(SPRITES);
if (errors.length > 0) {
  console.error(`\n[sprites] ${errors.length} error(es):\n  ${errors.join('\n  ')}\n`);
  process.exit(1);
}

const layout = layoutSheet(SPRITES);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sprites.png'), encodePng(layout.width, layout.height, rasterize(layout)));
writeFileSync(join(outDir, 'sprites.json'), JSON.stringify(spritesheetJson(layout, 'sprites.png')));

// Browser tab icon: the quiltro's first idle frame at ×4.
const icon = layout.frames.find((f) => f.key === 'quiltro/quieto/0');
if (icon) {
  const S = 4;
  const size = icon.w * S;
  const rgba = new Uint8Array(size * size * 4);
  const src = rasterize({ ...layout, frames: [{ ...icon, x: 0, y: 0 }], width: icon.w, height: icon.h });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const so = (Math.floor(y / S) * icon.w + Math.floor(x / S)) * 4;
      rgba.set(src.subarray(so, so + 4), (y * size + x) * 4);
    }
  }
  writeFileSync(join(outDir, 'icon.png'), encodePng(size, size, rgba));
}

console.warn(
  `[sprites] ${SPRITES.length} sprites, ${layout.frames.length} cuadros → ${layout.width}×${layout.height}`,
);
