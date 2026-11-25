import { recolor, shiftY, silhouette, withRows, type Frame, type SpriteDef } from '../types.ts';

/*
 * El Quiltro: caramelo, orejas paradas y un collar con placa, mirando a la derecha (se espeja en el juego).
 * (Fase 11.13: la pañoleta pasó a ser un collar; el color se sigue eligiendo en La Cucha.)
 * 24×24, contorno de tinta (k). Pivote en las patas.
 * Proporciones a lo Brotato: cabeza grande, ojo de 2×2 con brillo, lomo redondo, patas cortas.
 *
 * Leyenda rápida: k tinta · c caramelo · C caramelo tostado · l crema · b collar · a placa · W brillo · R boca
 * Las matrices se escriben con los pies en la fila 20 y se bajan 1 px al exportar.
 */
const EMPTY = '........................';

const STAND_RAW: Frame = [
  EMPTY,
  EMPTY,
  EMPTY,
  '.............k...k......',
  '............kCk.kCk.....',
  '............kCCkkCCk....',
  '..k........kcccccccck...',
  '.kck.......kccllccccck..',
  '.kck.......kcccckWcccckk',
  '..kck......kcccckkllllk.',
  '..kck......kcccccllllk..',
  '...kckkkkkkkbbbbkkkkk...',
  '....klllllcccacck.......',
  '...kccccccccccllck......',
  '...kCcccccccccllck......',
  '...kCCccccccccllck......',
  '....kCCllllllllcck......',
  '....kckkCkkkCkkck.......',
  '....kckkCk.kCkkck.......',
  '....klkkCk.kCkklk.......',
  '....kkkkkk.kkkkkk.......',
  EMPTY,
  EMPTY,
  EMPTY,
];

/** While trotting (and charging) the ears fly one pixel back. */
const EARS_BACK = {
  3: '............k...k.......',
  4: '...........kCk.kCk......',
  5: '...........kCCkkCCk.....',
};

/** Eye squeezed shut (hurt / dead). */
const SQUINT = {
  8: '.kck.......kcccckkcccckk',
  9: '..kck......kccccccllllk.',
};

/** Open mouth for the bark. */
const MOUTH_OPEN = {
  10: '..kck......kcccccRRRRk..',
  11: '...kckkkkkkkbbbbkllllk..',
  12: '....klllllcccacckkkkk...',
};

/** Crouch: body one pixel lower, legs one pixel shorter (row 18 removed). */
function crouch(f: Frame): Frame {
  return [EMPTY, ...f.slice(0, 18), ...f.slice(19)];
}

/** Lying on the floor: no legs, flat outline under the belly. */
function lying(f: Frame): Frame {
  return [EMPTY, EMPTY, EMPTY, ...f.slice(0, 17), '....kkkkkkkkkkkkk.......', EMPTY, EMPTY, EMPTY];
}

const RAW = {
  stand: STAND_RAW,
  /** Second idle frame: the tail wags one pixel back. */
  wag: withRows(STAND_RAW, {
    6: '.k.........kcccccccck...',
    7: 'kck........kccllccccck..',
    8: 'kck........kcccckWcccckk',
    9: '.kck.......kcccckkllllk.',
  }),
  /** Eyes closed: the top half of the eye turns to fur. */
  blink: withRows(STAND_RAW, { 8: '.kck.......kcccccccccckk' }),
  strideA: withRows(STAND_RAW, {
    ...EARS_BACK,
    18: '...kck.kCk.kCk.kck......',
    19: '..klk..kCk.kCk..klk.....',
    20: '..kkk..kkk.kkk..kkk.....',
  }),
  strideB: withRows(STAND_RAW, {
    ...EARS_BACK,
    17: '....kCkkckkkckkCk.......',
    18: '...kCk.kck.kck.kCk......',
    19: '..kCk..klk.klk..kCk.....',
    20: '..kkk..kkk.kkk..kkk.....',
  }),
  /** Legs pass under the body and the whole dog bounces up one pixel. */
  passing: shiftY(withRows(STAND_RAW, EARS_BACK), -1),
  crouchA: crouch(withRows(STAND_RAW, EARS_BACK)),
  crouchB: crouch(STAND_RAW),
  barkA: shiftY(withRows(STAND_RAW, MOUTH_OPEN), -1),
  barkB: shiftY(withRows(STAND_RAW, { ...MOUTH_OPEN, ...EARS_BACK }), -1),
  hurt: withRows(STAND_RAW, { ...SQUINT, ...EARS_BACK }),
  deadA: lying(withRows(STAND_RAW, SQUINT)),
  deadB: lying(
    withRows(STAND_RAW, {
      ...SQUINT,
      ...EARS_BACK,
      3: EMPTY,
      4: EMPTY,
      5: EMPTY,
      6: '............kCk.kCk.....',
      7: '...........kCCkkCCk.....',
      8: '...........kcccckkcccckk',
      9: '...........kccccccllllk.',
      10: '...........kcccccllllk..',
      11: '..kkkkkkkkkkbbbbkkkkk...',
      12: '.kcklllllcccacck........',
      13: '..kkccccccccccllck......',
    }),
  ),
  /** Asleep in front of La Cucha: lying, eyes shut, ears down when breathing out. */
  sleepA: lying(withRows(STAND_RAW, { 8: '.kck.......kcccccccccckk' })),
  sleepB: lying(withRows(STAND_RAW, { ...EARS_BACK, 8: '.kck.......kcccccccccckk' })),
};

export const QUILTRO_FRAMES = Object.fromEntries(
  Object.entries(RAW).map(([k, frame]) => [k, shiftY(frame, 1)]),
) as Record<keyof typeof RAW, Frame>;
const F = QUILTRO_FRAMES;

type Anims = SpriteDef['animations'];

/** The animation set every playable character must have (the player code uses these names). */
export function characterAnims(f: Record<keyof typeof RAW, Frame>): Anims {
  return {
    quieto: { fps: 3, frames: [f.stand, f.wag] },
    parpadeo: { fps: 8, frames: [f.blink], loop: false },
    trotar: { fps: 10, frames: [f.strideA, f.passing, f.strideB, f.passing] },
    /** Charging the ¡GUAU!: crouched, ears vibrating. */
    cargar: { fps: 12, frames: [f.crouchA, f.crouchB] },
    ladrar: { fps: 10, frames: [f.barkA, f.barkB, f.stand], loop: false },
    dano: { fps: 8, frames: [f.hurt], loop: false },
    muerte: { fps: 6, frames: [f.hurt, f.crouchA, f.deadA, f.deadB], loop: false },
    /** Dark silhouette howling at the moon (Aullido de las 12). */
    silueta: { fps: 1, frames: [silhouette(f.barkA, 'K')] },
    /** Main menu: asleep, then wakes up and stretches when touched. */
    dormir: { fps: 1.5, frames: [f.sleepA, f.sleepB] },
    estirar: { fps: 6, frames: [f.crouchA, f.crouchB, f.crouchA, f.barkA, f.barkA, f.stand], loop: false },
  };
}

/** Bandana colours unlocked by achievements: palette char → its shade. */
export const PAÑOLETAS: Readonly<Record<string, string>> = { b: 'B', r: 'R', y: 'A', w: 'G', a: 'A', f: 'F', p: 'r', t: 'T', o: 'O', v: 'f', i: 'I' };

const base = characterAnims(F);
const bandanas: Record<string, Anims[string]> = {};
for (const [c, shade] of Object.entries(PAÑOLETAS)) {
  if (c === 'b') continue;
  for (const [name, a] of Object.entries(base)) {
    if (name === 'silueta') continue;
    bandanas[`${name}@${c}`] = { ...a, frames: a.frames.map((fr) => recolor(fr, { b: c, B: shade })) };
  }
}

export const quiltro: SpriteDef = {
  name: 'quiltro',
  group: 'personajes',
  width: 24,
  height: 24,
  anchor: { x: 0.5, y: 22 / 24 },
  flash: true,
  animations: { ...base, ...bandanas },
};
