import { shiftY, withRows, type Frame, type SpriteDef } from '../types.ts';

/*
 * El Quiltro: caramelo, pañoleta azul, mirando a la derecha (se espeja en el juego).
 * 24×24, contorno de tinta (k). Pivote en las patas.
 * Proporciones a lo Brotato: cabeza grande, ojo de 2×2 con brillo, lomo redondo, patas cortas.
 *
 * Leyenda rápida: k tinta · c caramelo · C caramelo tostado · l crema · b/B pañoleta · W brillo
 * Las matrices se escriben con los pies en la fila 20 y se bajan 1 px al exportar.
 */
const STAND_RAW: Frame = [
  '........................',
  '........................',
  '........................',
  '........................',
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
  '........................',
  '........................',
  '........................',
];

/** While trotting the ears fly one pixel back. */
const EARS_BACK = {
  4: '............kk..kk......',
  5: '...........kCCkkCCk.....',
};

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
  blink: withRows(STAND_RAW, {
    8: '.kck.......kcccccccccckk',
  }),
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
  animations: {
    quieto: { fps: 3, frames: [F.stand, F.wag] },
    parpadeo: { fps: 8, frames: [F.blink], loop: false },
    trotar: { fps: 10, frames: [F.strideA, F.passing, F.strideB, F.passing] },
  },
};
