import { recolor, withRows, type Frame, type SpriteDef } from '../types.ts';

/* Comida que da más experiencia, objetos raros del suelo y la Caja del Almacén. */

const COMPLETO: Frame = [
  '..kkkkkkkk..',
  '.kwWwwWwwWk.',
  'kvvVvvvvVvvk',
  'krrrrRrrrrrk',
  'kooooooooook',
  '.kOOOOOOOOk.',
  '..kkkkkkkk..',
];

export const completo: SpriteDef = {
  name: 'completo',
  group: 'comida',
  width: 12,
  height: 7,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    brillo: { fps: 3, frames: [COMPLETO, COMPLETO, withRows(COMPLETO, { 1: '.kwWwwWwwWk.'.replace('wW', 'WW') })] },
  },
};

const CHORRILLANA: Frame = [
  '..kkkkkkkk..',
  '.kyydyyydyk.',
  'kydyyWWydyyk',
  'kyyyWaWyyydk',
  'kdyydWWdyyyk',
  'kwyyyyydyyyk',
  'kwwwwwwwwwwk',
  '.kGGGGGGGGk.',
  '..kkkkkkkk..',
];

export const chorrillana: SpriteDef = {
  name: 'chorrillana',
  group: 'comida',
  width: 12,
  height: 9,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    brillo: { fps: 3, frames: [CHORRILLANA, CHORRILLANA, withRows(CHORRILLANA, { 1: '.kyWdyyydyk.' })] },
  },
};

const MOTE: Frame = [
  'kkkkkkkk',
  'kiooooik',
  'kioAAoik',
  'kioAAoWk',
  'kiooooik',
  'kinnnnik',
  'kinnnnik',
  '.kiiiik.',
  '..kkkk..',
];

export const moteConHuesillo: SpriteDef = {
  name: 'mote',
  group: 'comida',
  width: 8,
  height: 9,
  anchor: { x: 0.5, y: 0.5 },
  animations: { brillo: { fps: 3, frames: [MOTE, MOTE, withRows(MOTE, { 1: 'kiWoooik' })] } },
};

const SILBIDO: Frame = [
  '.kkkkkkk.',
  'kGWGGGGGk',
  'kGGGGkGGk',
  'kgGGGGGgk',
  '.kkkkkgk.',
  '......kk.',
];

export const silbido: SpriteDef = {
  name: 'silbido',
  group: 'comida',
  width: 9,
  height: 6,
  anchor: { x: 0.5, y: 0.5 },
  animations: { brillo: { fps: 3, frames: [SILBIDO, SILBIDO, withRows(SILBIDO, { 1: 'kGGWGGGGk' })] } },
};

const TEMBLOR: Frame = [
  '..kkkkkk..',
  '.kOOkOOOk.',
  'kOOOOkOOOk',
  'kOOOkOOOOk',
  'kOOkkOOrOk',
  'kOOOkkOrOk',
  'kOOOOkOOOk',
  'kOOOkOOrOk',
  '.kOOkOOOk.',
  '..kkkkkk..',
];

export const temblor: SpriteDef = {
  name: 'temblor',
  group: 'comida',
  width: 10,
  height: 10,
  anchor: { x: 0.5, y: 0.5 },
  animations: { brillo: { fps: 6, frames: [TEMBLOR, recolor(TEMBLOR, { O: 'o' })] } },
};

/** Caja del Almacén 14×12: cajón de madera con etiqueta. La dorada es la de los jefes. */
const CAJA: Frame = [
  '.kkkkkkkkkkkk.',
  'kOooooooooooOk',
  'kkkkkkkkkkkkkk',
  'kodoooooooodok',
  'kodkkkkkkkkdok',
  'kodkwwwwwwkdok',
  'kodkwrrrrwkdok',
  'kodkwwwwwwkdok',
  'kodkkkkkkkkdok',
  'kodoooooooodok',
  'kOOOOOOOOOOOOk',
  '.kkkkkkkkkkkk.',
];
const CAJA_BRILLO = withRows(CAJA, { 1: 'kOWoooooooooOk' });

export const caja: SpriteDef = {
  name: 'caja',
  group: 'comida',
  width: 14,
  height: 12,
  anchor: { x: 0.5, y: 0.7 },
  animations: {
    normal: { fps: 4, frames: [CAJA, CAJA, CAJA_BRILLO] },
    dorada: {
      fps: 6,
      frames: [recolor(CAJA, { o: 'a', O: 'A', d: 'A' }), recolor(CAJA_BRILLO, { o: 'a', O: 'A', d: 'A' })],
    },
    abierta: { fps: 1, frames: [withRows(CAJA, { 0: '..............', 1: '.kkkkkkkkkkkk.', 2: 'kyWyyyyyyWyyyk' })] },
  },
};
