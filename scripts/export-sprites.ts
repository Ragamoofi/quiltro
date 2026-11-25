/**
 * Writes every sprite animation as a PNG strip to edit by hand: `npm run sprites:exportar`
 * (or `node scripts/export-sprites.ts 4` for images at ×4). See scripts/sprite-retouch.ts.
 * The strips always show the drawing of the code, never the retouched one, so they are a clean
 * starting point; the palette goes in `_paleta.png`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToRgb, PALETTE } from '../src/art/palette.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
import { encodePng } from './png.ts';
import { editableAnims, stripName, stripRgba } from './sprite-retouch.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'sprites-editables');
const scale = Math.max(1, Math.floor(Number(process.argv[2] ?? '1')) || 1);

rmSync(out, { recursive: true, force: true });
let count = 0;
for (const def of SPRITES) {
  const dir = join(out, def.group);
  mkdirSync(dir, { recursive: true });
  for (const anim of editableAnims(def)) {
    const a = def.animations[anim];
    if (!a || a.frames.length === 0) continue;
    const img = stripRgba(a.frames, scale);
    writeFileSync(join(dir, stripName(def.name, anim)), encodePng(img.width, img.height, img.rgba));
    count++;
  }
}

// The palette: one 16×16 square per colour, in the order of src/art/palette.ts.
const sw = 16;
const pw = sw * 8;
const ph = sw * Math.ceil(PALETTE.length / 8);
const pal = new Uint8Array(pw * ph * 4);
PALETTE.forEach((c, i) => {
  const [r, g, b] = hexToRgb(c.hex);
  const x0 = (i % 8) * sw;
  const y0 = Math.floor(i / 8) * sw;
  for (let y = 0; y < sw; y++) for (let x = 0; x < sw; x++) pal.set([r, g, b, 255], ((y0 + y) * pw + x0 + x) * 4);
});
writeFileSync(join(out, '_paleta.png'), encodePng(pw, ph, pal));

console.warn(`[sprites] ${count} tiras exportadas a sprites-editables/ (×${scale}) y la paleta en _paleta.png`);
