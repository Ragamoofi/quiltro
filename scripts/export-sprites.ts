/**
 * Writes every sprite animation as a PNG strip to edit by hand: `npm run sprites:exportar`
 * (or `node scripts/export-sprites.ts 4` for images at ×4). See scripts/sprite-retouch.ts.
 * The strips always show the drawing of the code, never the retouched one, so they are a clean
 * starting point; the palette goes in `_paleta.png`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToRgb, ART_PALETTE } from '../src/art/palette.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
import { encodePng } from './png.ts';
import { baseFrame, editableAnims, sheetRgba, stripName, stripRgba } from './sprite-retouch.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'sprites-editables');
const scale = Math.max(1, Math.floor(Number(process.argv[2] ?? '1')) || 1);

rmSync(out, { recursive: true, force: true });
let count = 0;
for (const def of SPRITES) {
  // One folder per sprite: its base frame, its whole sheet and each animation on its own.
  const dir = join(out, def.group, def.name);
  mkdirSync(dir, { recursive: true });
  const base = baseFrame(def);
  if (base) {
    const img = stripRgba([base], scale);
    writeFileSync(join(dir, `${def.name}__base.png`), encodePng(img.width, img.height, img.rgba));
  }
  const sheet = sheetRgba(def, scale);
  if (sheet.rows.length > 1) {
    writeFileSync(join(dir, `${def.name}__HOJA.png`), encodePng(sheet.width, sheet.height, sheet.rgba));
    const lines = sheet.rows.map((a, i) => `${i + 1}. ${a} (${def.animations[a]?.frames.length ?? 0} cuadros)`);
    writeFileSync(join(dir, `${def.name}__HOJA.txt`), [`Filas de ${def.name}__HOJA.png, de arriba hacia abajo:`, ...lines, ''].join('\r\n'));
  }
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
const ph = sw * Math.ceil(ART_PALETTE.length / 8);
const pal = new Uint8Array(pw * ph * 4);
ART_PALETTE.forEach((c, i) => {
  const [r, g, b] = hexToRgb(c.hex);
  const x0 = (i % 8) * sw;
  const y0 = Math.floor(i / 8) * sw;
  for (let y = 0; y < sw; y++) for (let x = 0; x < sw; x++) pal.set([r, g, b, 255], ((y0 + y) * pw + x0 + x) * 4);
});
writeFileSync(join(out, '_paleta.png'), encodePng(pw, ph, pal));

console.warn(`[sprites] ${count} tiras exportadas a sprites-editables/ (×${scale}) y la paleta en _paleta.png`);
