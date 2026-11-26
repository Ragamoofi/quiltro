import { colorOf, hexToRgb, TRANSPARENT } from './palette.ts';
import { animKey, frameKey, outlined, silhouette, type Animation, type SpriteDef } from './types.ts';

/** Problems found in sprite matrices. Empty means every sprite is valid. */
export function validateSprites(sprites: readonly SpriteDef[]): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const s of sprites) {
    if (names.has(s.name)) errors.push(`${s.name}: nombre repetido`);
    names.add(s.name);
    for (const [anim, a] of Object.entries(s.animations)) {
      if (a.frames.length === 0) errors.push(`${s.name}/${anim}: sin cuadros`);
      a.frames.forEach((frame, fi) => {
        const where = `${s.name}/${anim}/${fi}`;
        if (frame.length !== s.height) {
          errors.push(`${where}: ${frame.length} filas, se esperaban ${s.height}`);
        }
        frame.forEach((row, ri) => {
          if (row.length !== s.width) {
            errors.push(`${where} fila ${ri}: ${row.length} columnas, se esperaban ${s.width}`);
          }
          for (const ch of row) {
            if (ch !== TRANSPARENT && !colorOf(ch)) {
              errors.push(`${where} fila ${ri}: '${ch}' no está en la paleta`);
            }
          }
        });
      });
    }
  }
  return errors;
}

export interface PackedFrame {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rows: readonly string[];
  readonly anchor: { readonly x: number; readonly y: number };
}

export interface SheetLayout {
  readonly width: number;
  readonly height: number;
  readonly frames: readonly PackedFrame[];
  /** Animation key → ordered frame keys. */
  readonly animations: Readonly<Record<string, string[]>>;
  /** Animation key → { fps, loop } for the game and the preview. */
  readonly animMeta: Readonly<Record<string, { fps: number; loop: boolean }>>;
}

const PADDING = 1;

/** Grow horizontally before exceeding the common 4096px GPU texture limit.
 * More detailed characters otherwise turn the old 512px sheet into a 6000px strip. */
export function layoutTextureSheet(sprites: readonly SpriteDef[], maxSide = 4096): SheetLayout {
  for (let width = 512; width <= maxSide; width *= 2) {
    const layout = layoutSheet(sprites, width);
    if (layout.height <= maxSide) return layout;
  }
  throw new Error(`La hoja de sprites supera ${maxSide}px; hay que dividirla en varias texturas.`);
}

/** Shelf-packs every frame of every sprite into one sheet. */
export function layoutSheet(sprites: readonly SpriteDef[], sheetWidth = 256): SheetLayout {
  const items: Omit<PackedFrame, 'x' | 'y'>[] = [];
  const animations: Record<string, string[]> = {};
  const animMeta: Record<string, { fps: number; loop: boolean }> = {};

  for (const s of sprites) {
    const anchor = s.anchor ?? { x: 0.5, y: 1 };
    const anims: [string, Animation][] = Object.entries(s.animations);
    const base = Object.entries(s.animations);
    if (s.flash) {
      for (const [anim, a] of base) {
        anims.push([`${anim}_blanco`, { ...a, frames: a.frames.map((f) => silhouette(f, 'W')) }]);
      }
    }
    if (s.elite) {
      for (const [anim, a] of base) {
        const gold = a.frames.map((f) => outlined(f, 'a'));
        anims.push([`${anim}_elite`, { ...a, frames: gold }]);
        anims.push([`${anim}_elite_blanco`, { ...a, frames: gold.map((f) => silhouette(f, 'W')) }]);
      }
    }
    for (const [anim, a] of anims) {
      const keys: string[] = [];
      a.frames.forEach((rows, i) => {
        const key = frameKey(s.name, anim, i);
        keys.push(key);
        items.push({ key, w: rows[0]?.length ?? s.width, h: rows.length, rows, anchor });
      });
      animations[animKey(s.name, anim)] = keys;
      animMeta[animKey(s.name, anim)] = { fps: a.fps, loop: a.loop ?? true };
    }
  }

  // Tallest first keeps shelves tight. Stable on ties so output is deterministic.
  const order = items.map((it, i) => ({ it, i })).sort((a, b) => b.it.h - a.it.h || a.i - b.i);

  const frames: PackedFrame[] = [];
  let x = PADDING;
  let y = PADDING;
  let shelf = 0;
  for (const { it } of order) {
    if (x + it.w + PADDING > sheetWidth) {
      x = PADDING;
      y += shelf + PADDING;
      shelf = 0;
    }
    frames.push({ ...it, x, y });
    x += it.w + PADDING;
    shelf = Math.max(shelf, it.h);
  }
  const height = y + shelf + PADDING;
  return { width: sheetWidth, height, frames, animations, animMeta };
}

/** Rasterises a layout to RGBA bytes (width × height × 4). */
export function rasterize(layout: SheetLayout): Uint8Array {
  const data = new Uint8Array(layout.width * layout.height * 4);
  for (const f of layout.frames) {
    f.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const c = colorOf(row[rx] ?? TRANSPARENT);
        if (!c) continue;
        const [r, g, b] = hexToRgb(c.hex);
        const o = ((f.y + ry) * layout.width + (f.x + rx)) * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      }
    });
  }
  return data;
}

/** Pixi v8 spritesheet JSON for a layout. */
export function spritesheetJson(layout: SheetLayout, image: string): object {
  const frames: Record<string, object> = {};
  for (const f of layout.frames) {
    frames[f.key] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      anchor: f.anchor,
    };
  }
  return {
    frames,
    animations: layout.animations,
    meta: {
      app: 'quiltro/scripts/build-sprites.ts',
      image,
      format: 'RGBA8888',
      size: { w: layout.width, h: layout.height },
      scale: 1,
      animMeta: layout.animMeta,
    },
  };
}
