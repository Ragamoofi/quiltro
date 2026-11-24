import { shiftY, withRows, type Frame, type SpriteDef } from '../types.ts';

/*
 * El Quiltro: caramelo, pañoleta azul, mirando a la derecha (se espeja en el juego).
 * 24×24, contorno de tinta (k). Pivote en las patas.
 * Proporciones a lo Brotato: cabeza grande, ojo de 2×2 con brillo, lomo redondo, patas cortas.
 *
 * Leyenda rápida: k tinta · c caramelo · C caramelo tostado · l crema · b/B pañoleta · W brillo · R boca
 * Las matrices se escriben con los pies en la fila 20 y se bajan 1 px al exportar.
 */
const EMPTY = '........................';

const STAND_RAW: Frame = [
  EMPTY,
  EMPTY,
  EMPTY,
  EMPTY,
  '.............kk..kk.....',
  '............kCCkkCCk....',
  '..k........kcccccccck...',
  '.kck.......kccllccccck..',
  '.kck.......kcccckWcccckk',
  '..kck......kcccckkllllk.',
  '..kck......kcccccllllk..',
  '...kckkkkkkkbbbbkkkkk...',
  '....klllllcbbbbbk.......',
  '...kccccccccbbbbck......',
  '...kCcccccccbbBcck......',
  '...kCCccccccbBccck......',
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
  4: '............kk..kk......',
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
  12: '....klllllcbbbbbkkkkk...',
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
      6: EMPTY,
      7: EMPTY,
      8: '...........kcccckkcccckk',
      9: '...........kccccccllllk.',
      10: '...........kcccccllllk..',
      11: '..kkkkkkkkkkbbbbkkkkk...',
      12: '.kcklllllcbbbbbk........',
      13: '..kkccccccccbbbbck......',
    }),
  ),
};

const F = Object.fromEntries(
  Object.entries(RAW).map(([k, frame]) => [k, shiftY(frame, 1)]),
) as Record<keyof typeof RAW, Frame>;

export const quiltro: SpriteDef = {
  name: 'quiltro',
  group: 'personajes',
  width: 24,
  height: 24,
  anchor: { x: 0.5, y: 22 / 24 },
  flash: true,
  animations: {
    quieto: { fps: 3, frames: [F.stand, F.wag] },
    parpadeo: { fps: 8, frames: [F.blink], loop: false },
    trotar: { fps: 10, frames: [F.strideA, F.passing, F.strideB, F.passing] },
    /** Charging the ¡GUAU!: crouched, ears vibrating. */
    cargar: { fps: 12, frames: [F.crouchA, F.crouchB] },
    ladrar: { fps: 10, frames: [F.barkA, F.barkB, F.stand], loop: false },
    dano: { fps: 8, frames: [F.hurt], loop: false },
    muerte: { fps: 6, frames: [F.hurt, F.crouchA, F.deadA, F.deadB], loop: false },
  },
};
