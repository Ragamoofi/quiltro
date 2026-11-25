/**
 * Game resolution and scaling.
 *
 * The game is drawn at a small "native" size (landscape 480×270, portrait 270×480) and shown
 * at a WHOLE multiple of it in device pixels, so every game pixel stays a crisp square.
 * A window is rarely exactly 16:9 (a browser with its toolbar is about 1919×920), and the
 * leftover used to become dark bands around the game. Now the game area itself adapts to the
 * window: with the whole scale fixed, the drawing surface grows to cover what is left (up to half more than native), so the world, the HUD and the menus reach the edges with no bands.
 */
export const NATIVE_LANDSCAPE = { width: 480, height: 270 } as const;
export const NATIVE_PORTRAIT = { width: 270, height: 480 } as const;

/** The drawing surface may grow to this many times the native size (so nobody sees much more world than others). */
export const MAX_GROWTH = 1.5;
/** A phone held upright is much taller than 9:16 (19.5:9): its long side may grow further so there are no bands. */
export const MAX_GROWTH_TALL = 1.8;

export interface DisplayFit {
  /** Drawing surface in game pixels (native size or a bit larger). */
  width: number;
  height: number;
  portrait: boolean;
  /** Device-pixel scale: always a whole number ≥ 1. */
  scale: number;
  /** Canvas size in CSS pixels. */
  cssWidth: number;
  cssHeight: number;
}

export function fitDisplay(viewW: number, viewH: number, dpr: number): DisplayFit {
  const portrait = viewH > viewW;
  const native = portrait ? NATIVE_PORTRAIT : NATIVE_LANDSCAPE;
  const devW = viewW * dpr;
  const devH = viewH * dpr;
  const scale = Math.max(1, Math.floor(Math.min(devW / native.width, devH / native.height)));
  const width = Math.max(native.width, Math.min(Math.floor(native.width * MAX_GROWTH), Math.floor(devW / scale)));
  const growH = portrait ? MAX_GROWTH_TALL : MAX_GROWTH;
  const height = Math.max(native.height, Math.min(Math.floor(native.height * growH), Math.floor(devH / scale)));
  return {
    width,
    height,
    portrait,
    scale,
    cssWidth: (width * scale) / dpr,
    cssHeight: (height * scale) / dpr,
  };
}
