import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/* Proyectiles de las armas de la Fase 2: trompo, tejo, cohete y confeti de la chaya. */

/** Trompo 9×9: madera con franjas que corren para simular el giro, punta de metal. */
function trompoFrame(offset: number): Frame {
  const stripes = ['o', 'r', 'o', 'o', 'b', 'o', 'o'];
  const band = (from: number, to: number): string => {
    let s = '';
    for (let x = from; x <= to; x++) s += stripes[(x + offset) % stripes.length] ?? 'o';
    return s;
  };
  return [
    '....k....',
    '...kdk...',
    '.kkkkkkk.',
    `k${band(1, 7)}k`,
    `k${band(1, 7)}k`,
    `.k${band(2, 6)}k.`,
    `..k${band(3, 5)}k..`,
    '...kGk...',
    '....k....',
  ];
}

export const trompo: SpriteDef = {
  name: 'trompo',
  group: 'armas',
  width: 9,
  height: 9,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    girar: { fps: 16, frames: [0, 1, 2, 3, 4, 5, 6].map(trompoFrame) },
  },
};

const TEJO_A = outlined(new Pix(6, 6).disc(3, 3, 3, 'G').disc(3.6, 3.6, 2, 'g').set(2, 1, 'W').frame());
const TEJO_B = outlined(new Pix(6, 6).disc(3, 3, 3, 'G').disc(2.4, 3.6, 2, 'g').set(4, 2, 'W').frame());

export const tejo: SpriteDef = {
  name: 'tejo',
  group: 'armas',
  width: 8,
  height: 8,
  anchor: { x: 0.5, y: 0.5 },
  animations: { girar: { fps: 12, frames: [TEJO_A, TEJO_B] } },
};

/** Cohete visto desde arriba: una bola de luz con chispas (la estela va como partículas). */
const COHETE_A = outlined(new Pix(5, 5).disc(2.5, 2.5, 2.5, 'r').disc(2.5, 2.5, 1.6, 'y').set(2, 2, 'W').frame());
const COHETE_B = outlined(new Pix(5, 5).disc(2.5, 2.5, 2.5, 'a').disc(2.5, 2.5, 1.6, 'y').set(2, 2, 'W').frame());

export const cohete: SpriteDef = {
  name: 'cohete',
  group: 'armas',
  width: 7,
  height: 7,
  anchor: { x: 0.5, y: 0.5 },
  animations: { volar: { fps: 16, frames: [COHETE_A, COHETE_B] } },
};

/** Manchas de chaya en el suelo: confeti y una serpentina. */
const CONFETI: Frame[] = [
  ['..p.....', '......y.', '.t......', '....b...', '.y...r..', '......t.', '..r.....', '.....p..'],
  ['....t...', '.r......', '......p.', '..y.....', '.....b..', '.p......', '....y...', '..t...r.'],
  ['.y......', '...pp...', '....p..t', '.b...p..', '......y.', '..r.....', '.....t..', '.p......'],
];

export const confeti: SpriteDef = {
  name: 'confeti',
  group: 'armas',
  width: 8,
  height: 8,
  anchor: { x: 0.5, y: 0.5 },
  animations: Object.fromEntries(CONFETI.map((f, i) => [`v${i}`, { fps: 1, frames: [f] }])),
};
