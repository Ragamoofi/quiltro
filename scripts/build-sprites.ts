/**
 * Builds public/assets/sprites.png and public/assets/sprites.json from the pixel
 * matrices in src/art/sprites. Run with `npm run sprites` (Vite runs it too).
 * Fails loudly if any sprite has a wrong size or a colour outside the palette.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITES as DRAWN } from '../src/art/sprites/index.ts';
import { layoutTextureSheet, rasterize, spritesheetJson, validateSprites } from '../src/art/sheet.ts';
import { encodePng } from './png.ts';
import { applyRetouches } from './sprite-retouch.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets');

// Hand-retouched strips in sprites-retocados/ replace the drawing of the code (scripts/sprite-retouch.ts).
const { sprites: SPRITES, report } = applyRetouches(DRAWN, join(root, 'sprites-retocados'));
if (report.length > 0) console.warn(`[sprites] retocados:\n  ${report.join('\n  ')}`);

const errors = validateSprites(SPRITES);
if (errors.length > 0) {
  console.error(`\n[sprites] ${errors.length} error(es):\n  ${errors.join('\n  ')}\n`);
  process.exit(1);
}

const layout = layoutTextureSheet(SPRITES);
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

  // App icons (PWA): the quiltro on the ink colour, at the largest whole scale that stays inside
  // the "maskable" safe zone (the middle 60 %), so any round or squircle mask keeps the dog whole.
  const INK = [0x2a, 0x22, 0x33, 255] as const;
  const SKY = [0x2f, 0x7d, 0xe1, 255] as const;
  const dog = rasterize({ ...layout, frames: [{ ...icon, x: 0, y: 0 }], width: icon.w, height: icon.h });
  const appIcon = (px: number): Uint8Array => {
    const scale = Math.max(1, Math.floor((px * 0.6) / icon.w));
    const out = new Uint8Array(px * px * 4);
    for (let i = 0; i < px * px; i++) out.set(INK, i * 4);
    // A band of sky-blue "pañoleta" colour at the bottom, like the street the dog stands on.
    for (let y = Math.round(px * 0.74); y < px; y++) for (let x = 0; x < px; x++) out.set(SKY, (y * px + x) * 4);
    const w = icon.w * scale;
    const h = icon.h * scale;
    const left = Math.floor((px - w) / 2);
    // Feet on the band's top edge.
    const top = Math.round(px * 0.74) - Math.round(h * (22 / 24));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const so = (Math.floor(y / scale) * icon.w + Math.floor(x / scale)) * 4;
        if ((dog[so + 3] ?? 0) === 0) continue;
        out.set(dog.subarray(so, so + 4), ((top + y) * px + (left + x)) * 4);
      }
    }
    return out;
  };
  for (const px of [192, 512]) writeFileSync(join(outDir, `icon-${px}.png`), encodePng(px, px, appIcon(px)));
  writeFileSync(join(outDir, 'apple-touch-icon.png'), encodePng(180, 180, appIcon(180)));
}

console.warn(
  `[sprites] ${SPRITES.length} sprites, ${layout.frames.length} cuadros → ${layout.width}×${layout.height}`,
);
