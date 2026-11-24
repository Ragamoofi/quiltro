/**
 * Dev helper: renders every frame (or those whose key contains the filter) at a
 * zoom onto a floor-coloured PNG, so sprites can be reviewed without a browser.
 * Usage: node scripts/contact-sheet.ts <out.png> [filter] [zoom]
 */
import { writeFileSync } from 'node:fs';
import { hexToRgb, colorOf } from '../src/art/palette.ts';
import { layoutSheet } from '../src/art/sheet.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
import { encodePng } from './png.ts';

const [out = 'contact.png', filter = '', zoomArg = '4'] = process.argv.slice(2);
const Z = Number(zoomArg);
const frames = layoutSheet(SPRITES).frames.filter((f) => f.key.includes(filter) && !f.key.includes('_blanco'));

const W = 1200;
const PAD = 3 * Z;
let x = PAD;
let y = PAD;
let rowH = 0;
const placed: { f: (typeof frames)[number]; x: number; y: number }[] = [];
for (const f of frames) {
  if (x + f.w * Z + PAD > W) {
    x = PAD;
    y += rowH + PAD;
    rowH = 0;
  }
  placed.push({ f, x, y });
  x += f.w * Z + PAD;
  rowH = Math.max(rowH, f.h * Z);
}
const H = y + rowH + PAD;
const rgba = new Uint8Array(W * H * 4);
const [br, bg, bb] = hexToRgb('#8C8579');
for (let i = 0; i < W * H; i++) rgba.set([br, bg, bb, 255], i * 4);
for (const { f, x: px, y: py } of placed) {
  f.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const c = colorOf(row[rx] ?? '.');
      if (!c) continue;
      const rgb = hexToRgb(c.hex);
      for (let dy = 0; dy < Z; dy++) {
        for (let dx = 0; dx < Z; dx++) {
          rgba.set([...rgb, 255], ((py + ry * Z + dy) * W + (px + rx * Z + dx)) * 4);
        }
      }
    }
  });
}
writeFileSync(out, encodePng(W, H, rgba));
console.warn(`${placed.length} cuadros → ${out}`);
