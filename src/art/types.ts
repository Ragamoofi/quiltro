/**
 * A sprite is drawn as text: each frame is an array of rows and each character
 * is a palette colour (see palette.ts), with '.' as transparent.
 * scripts/build-sprites.ts packs every frame into public/assets/sprites.png and
 * writes a Pixi spritesheet JSON next to it.
 */
export type Frame = readonly string[];

export interface Animation {
  /** Frames per second (the GDD asks for 8–12). */
  readonly fps: number;
  readonly frames: readonly Frame[];
  /** Defaults to true. */
  readonly loop?: boolean;
}

export interface SpriteDef {
  /** Unique id, e.g. 'quiltro'. Frames are exported as `${name}/${anim}/${i}`. */
  readonly name: string;
  readonly width: number;
  readonly height: number;
  /** Pivot in 0..1 (defaults to bottom-centre: feet on the ground). */
  readonly anchor?: { readonly x: number; readonly y: number };
  /** Where the sprite belongs, used to group it in /sprites.html. */
  readonly group: 'personajes' | 'enemigos' | 'armas' | 'comida' | 'suelos' | 'decoracion' | 'efectos' | 'ui';
  readonly animations: Readonly<Record<string, Animation>>;
  /**
   * Also export every animation as `${anim}_blanco` with all pixels white,
   * for the 2-frame hit flash (GDD "Animación en pixel art").
   */
  readonly flash?: boolean;
}

export const frameKey = (sprite: string, anim: string, index: number): string =>
  `${sprite}/${anim}/${index}`;

export const animKey = (sprite: string, anim: string): string => `${sprite}/${anim}`;

/** Returns a copy of `base` with whole rows replaced (row index → new row). */
export function withRows(base: Frame, rows: Readonly<Record<number, string>>): Frame {
  return base.map((row, i) => rows[i] ?? row);
}

/** Moves every row up (negative) or down (positive), padding with transparency. */
export function shiftY(base: Frame, dy: number): Frame {
  const empty = '.'.repeat(base[0]?.length ?? 0);
  const out: string[] = [];
  for (let i = 0; i < base.length; i++) {
    out.push(base[i - dy] ?? empty);
  }
  return out;
}

/** Swaps colours: recolor(frame, { r: 'b', w: 'y' }). */
export function recolor(base: Frame, map: Readonly<Record<string, string>>): Frame {
  return base.map((row) => [...row].map((ch) => map[ch] ?? ch).join(''));
}

/** All visible pixels become `color` (used for hit flashes). */
export function silhouette(base: Frame, color: string): Frame {
  return base.map((row) => row.replace(/[^.]/g, color));
}

/** Mirrors a frame left↔right. */
export function mirrorX(base: Frame): Frame {
  return base.map((row) => [...row].reverse().join(''));
}

/**
 * Pads `rows` by one pixel on every side and adds a 1 px outline of `ink`
 * around every visible pixel (4-neighbour). Used for glyphs and small shapes.
 */
export function outlined(rows: Frame, ink = 'k'): Frame {
  const h = rows.length + 2;
  const w = (rows[0]?.length ?? 0) + 2;
  const at = (x: number, y: number): string => rows[y - 1]?.[x - 1] ?? '.';
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c !== '.') line += c;
      else if ([at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((n) => n !== '.' && n !== ink)) line += ink;
      else line += '.';
    }
    out.push(line);
  }
  return out;
}

/** Pastes `top` onto `base` at (x, y); '.' in `top` keeps the base pixel. */
export function paste(base: Frame, top: Frame, x: number, y: number): Frame {
  return base.map((row, ry) => {
    const t = top[ry - y];
    if (t === undefined) return row;
    const chars = [...row];
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c !== undefined && c !== '.' && x + i >= 0 && x + i < chars.length) chars[x + i] = c;
    }
    return chars.join('');
  });
}

/** Empty frame of the given size. */
export function blank(width: number, height: number): Frame {
  return Array.from({ length: height }, () => '.'.repeat(width));
}
