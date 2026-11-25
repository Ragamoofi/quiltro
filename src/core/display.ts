/**
 * Native pixel resolution and scaling.
 * Landscape renders at 480×270, portrait at 270×480 (GDD "Resolución y cámara").
 * The canvas is shown at a whole multiple of the native size in *device* pixels, so
 * every game pixel is a crisp square. Only when a whole multiple would leave a big
 * empty border (a 1080p monitor with a browser window about 955 px tall gets ×3 and
 * fills 85 % of the screen) it steps up by half: ×3,5 makes every other pixel 4
 * device pixels wide instead of 3, a regular pattern that still looks clean.
 */
export const NATIVE_LANDSCAPE = { width: 480, height: 270 } as const;
export const NATIVE_PORTRAIT = { width: 270, height: 480 } as const;

/** A whole scale that fills less than this share of the screen may step up by half. */
const MIN_FILL = 0.88;

export interface DisplayFit {
  /** Native game resolution. */
  width: number;
  height: number;
  portrait: boolean;
  /** Device-pixel scale: a whole number, or a whole number plus a half (≥ 1). */
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
  const exact = Math.min(devW / native.width, devH / native.height);
  let scale = Math.max(1, Math.floor(exact));
  const half = Math.floor(exact * 2) / 2;
  if (scale >= 2 && half > scale && scale / exact < MIN_FILL) scale = half;
  return {
    width: native.width,
    height: native.height,
    portrait,
    scale,
    cssWidth: (native.width * scale) / dpr,
    cssHeight: (native.height * scale) / dpr,
  };
}
