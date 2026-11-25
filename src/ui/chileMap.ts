import { Graphics } from 'pixi.js';
import { TOTAL_KM } from '../data/zonas.ts';
import { C } from './widgets.ts';

/** Zone colours along the map (north → south). */
const BANDS: { until: number; land: string; shade: string }[] = [
  { until: 0.25, land: 'o', shade: 'O' },
  { until: 0.5, land: 'y', shade: 'A' },
  { until: 0.75, land: 'v', shade: 'f' },
  { until: 1.01, land: 'i', shade: 'I' },
];

/**
 * Draws Chile as the long thin strip it is: `height` px tall, a few px wide,
 * the coast getting ragged (fjords) toward Patagonia. Returns the y for a km.
 * The map *is* the progress bar (GDD "Por qué puede volverse viral").
 */
export function drawChile(g: Graphics, x: number, y: number, height: number, width: number): (km: number) => number {
  for (let j = 0; j < height; j++) {
    const t = j / height;
    // Wider in the north, narrow in the middle, fragmented in the south.
    const wv = width * (0.85 + 0.25 * Math.sin(t * 9 + 1) * (1 - t) + (t > 0.8 ? 0.4 : 0));
    const ragged = t > 0.62 ? Math.round(Math.sin(j * 1.7) * Math.sin(j * 0.37) * 3 * (t - 0.55) * 4) : 0;
    const left = Math.round(x + Math.sin(t * 5) * width * 0.3 + (t > 0.9 ? (t - 0.9) * width * 6 : 0)) + ragged;
    const w = Math.max(2, Math.round(wv) - Math.max(0, ragged));
    const band = BANDS.find((b) => t < b.until) ?? BANDS[0];
    if (!band) continue;
    // Islands (Chiloé, the southern archipelago) are dithered off the coast.
    if (t > 0.66 && j % 3 === 0) g.rect(left - 3, y + j, 2, 1).fill(C(band.shade));
    g.rect(left - 1, y + j, w + 2, 1).fill(C('k'));
    g.rect(left, y + j, w, 1).fill(C(band.land));
    g.rect(left, y + j, 1, 1).fill(C(band.shade));
  }
  g.rect(Math.round(x + Math.sin(0) * width * 0.3) - 1, y - 1, Math.round(width * 0.85) + 2, 1).fill(C('k'));
  return (km: number) => y + Math.round((Math.min(km, TOTAL_KM) / TOTAL_KM) * (height - 1));
}

/** X of the coast's middle at a given y fraction (to place dots on the land). */
export function chileX(x: number, width: number, t: number): number {
  return Math.round(x + Math.sin(t * 5) * width * 0.3 + (t > 0.9 ? (t - 0.9) * width * 6 : 0) + width * 0.4);
}
