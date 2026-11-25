/**
 * Retouched sprites: PNGs drawn by hand in any program replace the frames that the code draws.
 *
 * - `npm run sprites:exportar` writes every animation as a strip PNG (frames side by side) in
 *   `sprites-editables/<grupo>/<sprite>__<animación>.png`.
 * - Copy the ones you want to change to `sprites-retocados/` (any subfolder), edit them, save as PNG.
 * - `npm run sprites` (and the dev server, on every save) puts them in the game.
 *
 * The image may be at ×1 or any whole scale (×2, ×4…): the scale is worked out from its height.
 * Colours are matched to the nearest colour of the game's palette so everything stays coherent;
 * pixels with less than half opacity are transparent.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { hexToRgb, PALETTE } from '../src/art/palette.ts';
import { PAÑOLETAS } from '../src/art/sprites/quiltro.ts';
import { recolor, type Frame, type SpriteDef } from '../src/art/types.ts';
import { decodePng } from './png.ts';

type Anim = SpriteDef['animations'][string];

/** Animations worth editing: the drawn ones, not those the build derives (bandana colours, silhouette). */
export function editableAnims(def: SpriteDef): string[] {
  return Object.keys(def.animations).filter((a) => !a.includes('@') && a !== 'silueta');
}

export function stripName(sprite: string, anim: string): string {
  return `${sprite}__${anim}.png`;
}

const RGB = PALETTE.map((p) => ({ ch: p.char, rgb: hexToRgb(p.hex) }));

/** The palette character closest to a colour (plain RGB distance, weighted for the eye). */
export function nearestChar(r: number, g: number, b: number): { ch: string; exact: boolean } {
  let best = RGB[0];
  let bd = Number.POSITIVE_INFINITY;
  for (const c of RGB) {
    const d = 2 * (c.rgb[0] - r) ** 2 + 4 * (c.rgb[1] - g) ** 2 + 3 * (c.rgb[2] - b) ** 2;
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return { ch: best?.ch ?? 'k', exact: bd === 0 };
}

/** Frames of one animation side by side as RGBA (× scale). */
export function stripRgba(frames: readonly Frame[], scale = 1): { width: number; height: number; rgba: Uint8Array } {
  const fw = frames[0]?.[0]?.length ?? 0;
  const fh = frames[0]?.length ?? 0;
  const width = fw * frames.length * scale;
  const height = fh * scale;
  const rgba = new Uint8Array(width * height * 4);
  frames.forEach((rows, i) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const hex = PALETTE.find((p) => p.char === ch)?.hex;
        if (!hex) return;
        const [r, g, b] = hexToRgb(hex);
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = (i * fw + x) * scale + sx;
            const py = y * scale + sy;
            rgba.set([r, g, b, 255], (py * width + px) * 4);
          }
        }
      });
    });
  });
  return { width, height, rgba };
}

/** Reads a strip back into frames of `fw`×`fh`; returns how many pixels were moved to the palette. */
export function stripToFrames(img: { width: number; height: number; rgba: Uint8Array }, count: number, fw: number, fh: number): { frames: Frame[]; adjusted: number } {
  const scale = img.height / fh;
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`alto ${img.height} px: tiene que ser ${fh} px (o ${fh * 2}, ${fh * 4}…)`);
  if (img.width !== fw * count * scale) throw new Error(`ancho ${img.width} px: tiene que ser ${fw * count * scale} px (${count} cuadros de ${fw * scale} px)`);
  let adjusted = 0;
  const frames: Frame[] = [];
  for (let i = 0; i < count; i++) {
    const rows: string[] = [];
    for (let y = 0; y < fh; y++) {
      let line = '';
      for (let x = 0; x < fw; x++) {
        // The centre pixel of each block (works at ×1 and at any scale).
        const px = (i * fw + x) * scale + Math.floor(scale / 2);
        const py = y * scale + Math.floor(scale / 2);
        const o = (py * img.width + px) * 4;
        if ((img.rgba[o + 3] ?? 0) < 128) {
          line += '.';
          continue;
        }
        const n = nearestChar(img.rgba[o] ?? 0, img.rgba[o + 1] ?? 0, img.rgba[o + 2] ?? 0);
        if (!n.exact) adjusted++;
        line += n.ch;
      }
      rows.push(line);
    }
    frames.push(rows);
  }
  return { frames, adjusted };
}

function pngsIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...pngsIn(p));
    else if (name.toLowerCase().endsWith('.png')) out.push(p);
  }
  return out;
}

/** The sprites with every retouched strip found in `dir` put in place, and what happened to each file. */
export function applyRetouches(sprites: readonly SpriteDef[], dir: string): { sprites: SpriteDef[]; report: string[] } {
  const report: string[] = [];
  const byName = new Map(sprites.map((s) => [s.name, s]));
  const changed = new Map<string, Record<string, Anim>>();
  for (const file of pngsIn(dir)) {
    const name = basename(file, '.png');
    const [sprite, anim] = name.split('__');
    const def = sprite ? byName.get(sprite) : undefined;
    const base = def && anim ? def.animations[anim] : undefined;
    if (!def || !anim || !base) {
      report.push(`✗ ${name}.png: no existe ese sprite o animación (el nombre debe ser sprite__animación.png, como en sprites-editables)`);
      continue;
    }
    try {
      const fw = base.frames[0]?.[0]?.length ?? def.width;
      const fh = base.frames[0]?.length ?? def.height;
      const { frames, adjusted } = stripToFrames(decodePng(readFileSync(file)), base.frames.length, fw, fh);
      const anims = changed.get(def.name) ?? { ...def.animations };
      anims[anim] = { ...base, frames };
      // The quiltro's bandana colours follow the retouched drawing unless they were retouched too.
      if (def.name === 'quiltro') {
        for (const [c, shade] of Object.entries(PAÑOLETAS)) {
          const key = `${anim}@${c}`;
          if (def.animations[key] && !pngsIn(dir).some((f) => basename(f, '.png') === `quiltro__${key}`)) {
            anims[key] = { ...base, frames: frames.map((f) => recolor(f, { b: c, B: shade })) };
          }
        }
      }
      changed.set(def.name, anims);
      report.push(`✓ ${name}.png${adjusted > 0 ? ` (${adjusted} píxeles pasados al color más cercano de la paleta)` : ''}`);
    } catch (err) {
      report.push(`✗ ${name}.png: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { sprites: sprites.map((s) => (changed.has(s.name) ? { ...s, animations: changed.get(s.name) ?? s.animations } : s)), report };
}
