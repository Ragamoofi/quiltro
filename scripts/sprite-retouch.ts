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

// ---------------------------------------------------------------------------------------------
// Faster ways to retouch (Fase 11.12)
//
//  - `<sprite>__base.png`: ONE frame (the first one of the first animation, e.g. the character
//    standing). What you change in it is looked for in every frame of every animation (it may be a
//    few pixels higher or lower when the body bounces) and pasted there too. Edit the face once and
//    it changes everywhere it fits.
//  - `<sprite>__HOJA.png`: every animation of the sprite in one image, one animation per row, in the
//    order of `<sprite>__HOJA.txt`. Edit them all side by side.
//  - `<sprite>__<animación>.png`: one animation (as before). It wins over the other two.

/** The animations that go in a sprite's sheet: the editable ones whose frames have the sprite's size. */
export function sheetAnims(def: SpriteDef): string[] {
  const first = def.animations[editableAnims(def)[0] ?? '']?.frames[0];
  const fw = first?.[0]?.length ?? def.width;
  const fh = first?.length ?? def.height;
  return editableAnims(def).filter((a) => {
    const f = def.animations[a]?.frames[0];
    return !!f && f.length === fh && (f[0]?.length ?? 0) === fw;
  });
}

function sheetSize(def: SpriteDef): { rows: string[]; fw: number; fh: number; cols: number } {
  const rows = sheetAnims(def);
  const first = def.animations[rows[0] ?? '']?.frames[0];
  return {
    rows,
    fw: first?.[0]?.length ?? def.width,
    fh: first?.length ?? def.height,
    cols: Math.max(1, ...rows.map((a) => def.animations[a]?.frames.length ?? 0)),
  };
}

/** Every animation of a sprite as rows of one image (left aligned, transparent after the last frame). */
export function sheetRgba(def: SpriteDef, scale = 1): { width: number; height: number; rgba: Uint8Array; rows: string[] } {
  const { rows, fh, fw, cols } = sheetSize(def);
  const width = cols * fw * scale;
  const height = rows.length * fh * scale;
  const rgba = new Uint8Array(width * height * 4);
  rows.forEach((a, r) => {
    const strip = stripRgba(def.animations[a]?.frames ?? [], scale);
    for (let y = 0; y < strip.height; y++) {
      rgba.set(strip.rgba.subarray(y * strip.width * 4, (y + 1) * strip.width * 4), (r * fh * scale + y) * width * 4);
    }
  });
  return { width, height, rgba, rows };
}

/** Splits a sheet back into its animations (same rows as `sheetRgba`). */
export function sheetToAnims(img: { width: number; height: number; rgba: Uint8Array }, def: SpriteDef): { anims: Record<string, Frame[]>; adjusted: number } {
  const { rows, fh, fw, cols } = sheetSize(def);
  const scale = img.height / (rows.length * fh);
  if (!Number.isInteger(scale) || scale < 1 || img.width !== cols * fw * scale) {
    throw new Error(`la hoja debe medir ${cols * fw}×${rows.length * fh} px (o el doble, el cuádruple…) y mide ${img.width}×${img.height}`);
  }
  const anims: Record<string, Frame[]> = {};
  let adjusted = 0;
  rows.forEach((a, r) => {
    const count = def.animations[a]?.frames.length ?? 0;
    const rowW = count * fw * scale;
    const rowH = fh * scale;
    const part = new Uint8Array(rowW * rowH * 4);
    for (let y = 0; y < rowH; y++) {
      const src = (r * rowH + y) * img.width * 4;
      part.set(img.rgba.subarray(src, src + rowW * 4), y * rowW * 4);
    }
    const res = stripToFrames({ width: rowW, height: rowH, rgba: part }, count, fw, fh);
    anims[a] = res.frames;
    adjusted += res.adjusted;
  });
  return { anims, adjusted };
}

/** The frame a `__base.png` stands for: the first frame of the first editable animation. */
export function baseFrame(def: SpriteDef): Frame | undefined {
  return def.animations[editableAnims(def)[0] ?? '']?.frames[0];
}

const SEARCH = 4;

/**
 * Pastes the changes made to the base frame into every frame where the same original pixels
 * appear (allowing the body to be up to 4 px off). Returns the new animations and where it fitted.
 */
export function propagate(
  anims: Readonly<Record<string, Anim>>,
  names: readonly string[],
  original: Frame,
  edited: Frame,
): { anims: Record<string, Anim>; fitted: number; total: number; missed: string[] } {
  const h = original.length;
  const w = original[0]?.length ?? 0;
  const diff: { x: number; y: number; ch: string }[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (edited[y]?.[x] !== original[y]?.[x]) diff.push({ x, y, ch: edited[y]?.[x] ?? '.' });
  const out: Record<string, Anim> = { ...anims };
  if (diff.length === 0) return { anims: out, fitted: 0, total: 0, missed: [] };
  // The area around the change: what must match for the change to be pasted somewhere else.
  const x0 = Math.max(0, Math.min(...diff.map((d) => d.x)) - 2);
  const x1 = Math.min(w - 1, Math.max(...diff.map((d) => d.x)) + 2);
  const y0 = Math.max(0, Math.min(...diff.map((d) => d.y)) - 2);
  const y1 = Math.min(h - 1, Math.max(...diff.map((d) => d.y)) + 2);
  const solid: { x: number; y: number; ch: string }[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((original[y]?.[x] ?? '.') !== '.') solid.push({ x, y, ch: original[y]?.[x] ?? '.' });
  let fitted = 0;
  let total = 0;
  const missed: string[] = [];
  for (const name of names) {
    const a = anims[name];
    if (!a) continue;
    const frames = a.frames.map((f, i) => {
      total++;
      if (f.length !== h || (f[0]?.length ?? 0) !== w) {
        missed.push(`${name}/${i}`);
        return f;
      }
      // Best offset: where most of the original area is found again (no shift wins ties).
      let best = { dx: 0, dy: 0, score: -1 };
      for (let dy = -SEARCH; dy <= SEARCH; dy++) {
        for (let dx = -SEARCH; dx <= SEARCH; dx++) {
          let score = 0;
          for (const p of solid) if (f[p.y + dy]?.[p.x + dx] === p.ch) score++;
          if (score > best.score || (score === best.score && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy))) best = { dx, dy, score };
        }
      }
      if (solid.length === 0 || best.score / solid.length < 0.8) {
        missed.push(`${name}/${i}`);
        return f;
      }
      fitted++;
      const rows = f.map((r) => [...r]);
      for (const d of diff) {
        const row = rows[d.y + best.dy];
        const xx = d.x + best.dx;
        // Only where this frame still shows what the original had there: a closed eye, an open
        // mouth or a raised paw drawn differently in this frame stays as it is.
        if (row && xx >= 0 && xx < row.length && row[xx] === (original[d.y]?.[d.x] ?? '.')) row[xx] = d.ch;
      }
      return rows.map((r) => r.join(''));
    });
    out[name] = { ...a, frames };
  }
  return { anims: out, fitted, total, missed };
}

/** The sprites with every retouched file found in `dir` put in place, and what happened to each file. */
export function applyRetouches(sprites: readonly SpriteDef[], dir: string): { sprites: SpriteDef[]; report: string[] } {
  const report: string[] = [];
  const byName = new Map(sprites.map((s) => [s.name, s]));
  const files = pngsIn(dir).map((f) => ({ path: f, name: basename(f, '.png') }));
  const touched = new Map<string, { anims: Record<string, Anim>; changed: Set<string> }>();
  const state = (def: SpriteDef): { anims: Record<string, Anim>; changed: Set<string> } => {
    let st = touched.get(def.name);
    if (!st) {
      st = { anims: { ...def.animations }, changed: new Set() };
      touched.set(def.name, st);
    }
    return st;
  };
  const note = (adjusted: number): string => (adjusted > 0 ? ` (${adjusted} píxeles pasados al color más cercano de la paleta)` : '');
  // Order: the base frame first, then the sheets, then single animations (the most specific wins).
  const kind = (n: string): number => (n.endsWith('__base') ? 0 : n.endsWith('__HOJA') ? 1 : 2);
  for (const { path, name } of [...files].sort((a, b) => kind(a.name) - kind(b.name))) {
    const [sprite, anim] = name.split('__');
    const def = sprite ? byName.get(sprite) : undefined;
    if (!def || !anim) {
      report.push(`✗ ${name}.png: no existe ese sprite (el nombre debe ser como en sprites-editables)`);
      continue;
    }
    try {
      const img = decodePng(readFileSync(path));
      const st = state(def);
      if (anim === 'base') {
        const original = baseFrame(def);
        if (!original) throw new Error('este sprite no tiene cuadros');
        const { frames, adjusted } = stripToFrames(img, 1, original[0]?.length ?? def.width, original.length);
        const names = editableAnims(def);
        const res = propagate(st.anims, names, original, frames[0] ?? original);
        st.anims = res.anims;
        for (const n of names) st.changed.add(n);
        const miss = res.missed.length > 0 ? ` (no calzó en ${res.missed.slice(0, 6).join(', ')}${res.missed.length > 6 ? '…' : ''}: esos retócalos en la hoja o en su tira)` : '';
        report.push(res.total === 0 ? `· ${name}.png: igual al original, no cambia nada` : `✓ ${name}.png: el cambio entró en ${res.fitted} de ${res.total} cuadros${miss}${note(adjusted)}`);
      } else if (anim === 'HOJA') {
        const { anims, adjusted } = sheetToAnims(img, def);
        for (const [a, frames] of Object.entries(anims)) {
          const prev = st.anims[a];
          if (!prev) continue;
          st.anims[a] = { ...prev, frames };
          st.changed.add(a);
        }
        report.push(`✓ ${name}.png (${Object.keys(anims).length} animaciones)${note(adjusted)}`);
      } else {
        const prev = st.anims[anim];
        if (!prev) throw new Error(`no existe la animación «${anim}»`);
        const fw = prev.frames[0]?.[0]?.length ?? def.width;
        const fh = prev.frames[0]?.length ?? def.height;
        const { frames, adjusted } = stripToFrames(img, prev.frames.length, fw, fh);
        st.anims[anim] = { ...prev, frames };
        st.changed.add(anim);
        report.push(`✓ ${name}.png${note(adjusted)}`);
      }
    } catch (err) {
      report.push(`✗ ${name}.png: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  // The quiltro's bandana colours follow the retouched drawing unless they were retouched themselves.
  const q = touched.get('quiltro');
  if (q) {
    for (const a of q.changed) {
      if (a.includes('@')) continue;
      const base = q.anims[a];
      for (const [c, shade] of Object.entries(PAÑOLETAS)) {
        const key = `${a}@${c}`;
        if (base && q.anims[key] && !files.some((f) => f.name === `quiltro__${key}`)) {
          q.anims[key] = { ...base, frames: base.frames.map((f) => recolor(f, { b: c, B: shade })) };
        }
      }
    }
  }
  return { sprites: sprites.map((s) => (touched.has(s.name) ? { ...s, animations: touched.get(s.name)?.anims ?? s.animations } : s)), report };
}
