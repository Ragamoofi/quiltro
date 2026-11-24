/**
 * Native pixel resolution and integer scaling.
 * Landscape renders at 480×270, portrait at 270×480 (GDD "Resolución y cámara").
 * The canvas is always shown at a whole multiple of the native size in *device*
 * pixels, so every game pixel is a crisp square.
 */
export const NATIVE_LANDSCAPE = { width: 480, height: 270 } as const;
export const NATIVE_PORTRAIT = { width: 270, height: 480 } as const;

export interface DisplayFit {
  /** Native game resolution. */
  width: number;
  height: number;
  portrait: boolean;
  /** Integer device-pixel scale (≥ 1). */
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
  return {
    width: native.width,
    height: native.height,
    portrait,
    scale,
    cssWidth: (native.width * scale) / dpr,
    cssHeight: (native.height * scale) / dpr,
  };
}
