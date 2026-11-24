import { recolor, type Frame, type SpriteDef } from '../types.ts';

/*
 * Volantín 11×11: rombo de dos colores (como los de papel volantín), contorno de tinta.
 * El segundo cuadro oscurece la mitad derecha, como si el viento la doblara.
 * La cola y el hilo se dibujan en el juego.
 */
const VOLANTIN: Frame = [
  '.....k.....',
  '....krk....',
  '...krrwk...',
  '..krrrwwk..',
  '.krrrrwwwk.',
  'krrrrrwwwwk',
  '.krrrrwwwk.',
  '..krrrwwk..',
  '...krrwk...',
  '....krk....',
  '.....k.....',
];
const VOLANTIN_VIENTO = recolor(VOLANTIN, { w: 'G' });

/** Colour pairs (left half, right half, right half in the wind). */
const COLORES: readonly [string, string, string][] = [
  ['r', 'w', 'G'],
  ['b', 'y', 'A'],
  ['p', 't', 'T'],
  ['y', 'b', 'B'],
];

export const volantin: SpriteDef = {
  name: 'volantin',
  group: 'armas',
  width: 11,
  height: 11,
  anchor: { x: 0.5, y: 0.5 },
  animations: Object.fromEntries(
    COLORES.map(([l, r, rw], i) => [
      `v${i}`,
      {
        fps: 8,
        frames: [recolor(VOLANTIN, { r: l, w: r }), recolor(VOLANTIN_VIENTO, { r: l, G: rw })],
      },
    ]),
  ),
};

/** Tail ribbon colours per kite variant (for the trailing pixels). */
export const VOLANTIN_COLA = ['r', 'b', 'p', 'y'] as const;
export const VOLANTIN_VARIANTES = COLORES.length;
