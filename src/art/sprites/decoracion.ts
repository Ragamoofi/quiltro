import type { Frame, SpriteDef } from '../types.ts';

/*
 * Decoración del Centro (Santiago): poste con aisladores para la maraña de cables,
 * quiosco, carro de sopaipillas y grifo. Todos con pivote en la base para
 * ordenarse por su posición vertical (el quiltro pasa por detrás).
 */

const POSTE_FUSTE = '......kGgk......';
const POSTE_MANCHA = '......kGMk......';
const POSTE: Frame = [
  '................',
  '.kk....kk....kk.',
  'kwwkkkkwwkkkkwwk',
  'kddddddddddddddk',
  '.kkkkkkGgkkkkkk.',
  ...Array.from({ length: 32 }, (_, i) => (i % 11 === 7 ? POSTE_MANCHA : POSTE_FUSTE)),
  '.....kkGgkk.....',
  '.....kMMMMk.....',
  '.....kkkkkk.....',
];

export const poste: SpriteDef = {
  name: 'poste',
  group: 'decoracion',
  width: 16,
  height: 40,
  anchor: { x: 0.5, y: 1 },
  animations: { quieto: { fps: 1, frames: [POSTE] } },
};

/** Where the three insulators are, relative to the pivot (for drawing cables). */
export const POSTE_AISLADORES = [
  { x: -6, y: -38 },
  { x: 0, y: -38 },
  { x: 6, y: -38 },
] as const;

const QUIOSCO_CUERPO = '..kvvvvvvfvvvvvvfvvvvvvfvvvvvk..';
const QUIOSCO: Frame = [
  '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  '.kffffffffffffffffffffffffffffk.',
  'kFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  'kwwrrwwrrwwrrwwrrwwrrwwrrwwrrwwk',
  'kwwrrwwrrwwrrwwrrwwrrwwrrwwrrwwk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '..kKKKKKKKKKKKKKKKKKKKKKKKKKKk..',
  '..kKaypbtaypbtaypbtaypbtaypbKk..',
  '..kKtbayptbayptbayptbayptbayKk..',
  '..kKddddddddddddddddddddddddKk..',
  '..kKpywtapywtapywtapywtapywtKk..',
  '..kKywtapywtapywtapywtapywtaKk..',
  '..kKddddddddddddddddddddddddKk..',
  '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  QUIOSCO_CUERPO,
  '..kffffffFffffffFffffffFfffffk..',
  '..kffffffFffffffFffffffFfffffk..',
  '..kFFFFFFFFFFFFFFFFFFFFFFFFFFk..',
  '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  '...MMMMMMMMMMMMMMMMMMMMMMMMMM...',
  '................................',
];

export const quiosco: SpriteDef = {
  name: 'quiosco',
  group: 'decoracion',
  width: 32,
  height: 32,
  anchor: { x: 0.5, y: 31 / 32 },
  animations: { quieto: { fps: 1, frames: [QUIOSCO] } },
};

const CARRO: Frame = [
  '........kkkkkkkk........',
  '......kkrrwwrrwwkk......',
  '....kkrrwwrrwwrrwwkk....',
  '...krrwwrrwwrrwwrrwwk...',
  '...kkkkkkkkkkkkkkkkkk...',
  '...........kk...........',
  '...........kk...........',
  '..kkkkkkkkkkkkkkkkkkkk..',
  '..kaAaaAaaAaaAaaAaaAak..',
  '..kMMMMMMMMMMMMMMMMMMk..',
  '..kyyyyyyyyyyyyyyyyyyk..',
  '..krrrrrrrrrrrrrrrrrrk..',
  '..kyyyyyyyyyyyyyyyyyyk..',
  '..kAAAAAAAAAAAAAAAAAAk..',
  '..kkkkkkkkkkkkkkkkkkkk..',
  '...kkkk.........kkkk....',
  '...kGgk.........kGgk....',
  '...kgGk.........kgGk....',
  '...kkkk.........kkkk....',
  '..MMMMMMMMMMMMMMMMMMMM..',
];

export const carro: SpriteDef = {
  name: 'carro_sopaipillas',
  group: 'decoracion',
  width: 24,
  height: 20,
  anchor: { x: 0.5, y: 19 / 20 },
  animations: { quieto: { fps: 1, frames: [CARRO] } },
};

const GRIFO: Frame = [
  '...kkkk...',
  '..kyyyyk..',
  '.kkkkkkkk.',
  '.kyyyyyAk.',
  'kkyyyyyAkk',
  'kAyyyyyAAk',
  'kkyyyyyAkk',
  '.kyyyyyAk.',
  '.kyyyyyAk.',
  'kkkkkkkkkk',
  'kMMMMMMMMk',
  '.MMMMMMMM.',
];

export const grifo: SpriteDef = {
  name: 'grifo',
  group: 'decoracion',
  width: 10,
  height: 12,
  anchor: { x: 0.5, y: 11 / 12 },
  animations: { quieto: { fps: 1, frames: [GRIFO] } },
};
