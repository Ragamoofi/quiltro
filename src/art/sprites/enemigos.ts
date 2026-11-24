import { withRows, type Frame, type SpriteDef } from '../types.ts';

/*
 * Enemigos chicos de la Fase 1. Todos miran a la derecha y se espejan en el juego.
 * `flash: true` genera la versión blanca para el destello de golpe.
 */

// Zancudo 12×12: cuerpo oscuro, panza roja (ya picó), alas claras que zumban.
const ZANCUDO_A: Frame = [
  '............',
  '....kk......',
  '...kWGk.....',
  '...kGGk.....',
  '....kGk.kk..',
  '.kk..kkkKKk.',
  'kRrkkKKKKkkk',
  '.kRRkKgKk...',
  '..kkk.k.k...',
  '......k..k..',
  '.....k...k..',
  '............',
];
const ZANCUDO_B = withRows(ZANCUDO_A, {
  1: '............',
  2: '............',
  3: '.kkk........',
  4: 'kWGGkk..kk..',
});

export const zancudo: SpriteDef = {
  name: 'zancudo',
  group: 'enemigos',
  width: 12,
  height: 12,
  anchor: { x: 0.5, y: 0.75 },
  flash: true,
  elite: true,
  animations: {
    volar: { fps: 16, frames: [ZANCUDO_A, ZANCUDO_B] },
  },
};

// Paloma de la Plaza 16×12: gris, cuello tornasol, patitas rosadas.
const PALOMA_MEDIO: Frame = [
  '................',
  '...........kkk..',
  '..........kGGGk.',
  '..........kGkGMk',
  '...........kTTk.',
  '..kkkkkkk.kTTk..',
  '.kgggggggkGTk...',
  'kgGgGgGgGkGGGk..',
  '.kkkkkkkkGGGGk..',
  'kkGGGGGGGGGGk...',
  '.kkkkkkkkkkk....',
  '......p..p......',
];
const PALOMA_ARRIBA: Frame = [
  '..kkk...........',
  '.kGGgk.....kkk..',
  '.kGGgk....kGGGk.',
  '..kGGgk...kGkGMk',
  '..kGGggk...kTTk.',
  '...kGGggk.kTTk..',
  '....kkkkkkGTk...',
  '..kkkkkkkkGGGk..',
  '.kGGGGGGGGGGGk..',
  'kkGGGGGGGGGGk...',
  '.kkkkkkkkkkk....',
  '......p..p......',
];
const PALOMA_ABAJO: Frame = [
  '................',
  '...........kkk..',
  '..........kGGGk.',
  '..........kGkGMk',
  '...........kTTk.',
  '...kkkkkkkkTTk..',
  '..kGGGGGGGGGTk..',
  'kkGGGGGGGGGGGk..',
  '.kkkgGgGgkkkk...',
  '...kgGgGk.......',
  '....kkkk........',
  '................',
];

export const paloma: SpriteDef = {
  name: 'paloma',
  group: 'enemigos',
  width: 16,
  height: 12,
  anchor: { x: 0.5, y: 0.75 },
  flash: true,
  elite: true,
  animations: {
    volar: { fps: 10, frames: [PALOMA_MEDIO, PALOMA_ARRIBA, PALOMA_MEDIO, PALOMA_ABAJO] },
  },
};
