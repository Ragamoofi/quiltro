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
  readonly group: 'personajes' | 'enemigos' | 'armas' | 'comida' | 'suelos' | 'decoracion' | 'ui';
  readonly animations: Readonly<Record<string, Animation>>;
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
