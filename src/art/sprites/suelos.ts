import type { SpriteDef } from '../types.ts';

/*
 * Baldosas de suelo 16×16. Colores apagados para que todo lo que se mueve resalte.
 * Cada zona es un sprite `suelo_<zona>` con una animación `variantes`
 * (un cuadro por variante; el mundo elige una por celda de forma determinista).
 *
 * Centro: pastelones (m) con juntas de asfalto (M) y alguna mancha (M).
 */
const LISO = [
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmMmmmmmmmmmmmmM',
  'mmmmmmmmmmmMmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmMmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mMmmmmmmmmmmMmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmMmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'MMMMMMMMMMMMMMMM',
];

const TRIZADO = [
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmMmmmmmM',
  'mmmmmmmmMmmmmmmM',
  'mmmmmmmMmmmmmmmM',
  'mmmmmmMMmmmmmmmM',
  'mmmmmMmmmmmmmmmM',
  'mmmmMmmmmmmmmmmM',
  'mmmmMmmmmmmmmmmM',
  'mmmMmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmMmmmM',
  'mmmmmmmmmmmmmmmM',
  'mMmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'MMMMMMMMMMMMMMMM',
];

const CON_PASTO = [
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmMmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmMmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmmmM',
  'mmmmmmmmmmmmmVmM',
  'mmmmmmmmmmmmVvVM',
  'mmmmmmmmmmmmvvmM',
  'MMMMMMMMMMMMMvMM',
];

const ADOQUIN = [
  'mmmmmmmMmmmmmmmM',
  'mmmmmmmMmmmmmmmM',
  'mmMmmmmMmmmmmmmM',
  'mmmmmmmMmmmmmmmM',
  'mmmmmmmMmmmmmMmM',
  'mmmmmmmMmmmmmmmM',
  'mmmmmmmMmmmmmmmM',
  'MMMMMMMMMMMMMMMM',
  'mmmMmmmmmmmMmmmM',
  'mmmMmmmmmmmMmmmM',
  'mmmMmmmMmmmMmmmM',
  'mmmMmmmmmmmMmmmM',
  'mmmMmmmmmmmMmmmM',
  'mmmMmmmmmmmMmmmM',
  'mmmMmmmmmmmMmmmM',
  'MMMMMMMMMMMMMMMM',
];

export const sueloCentro: SpriteDef = {
  name: 'suelo_centro',
  group: 'suelos',
  width: 16,
  height: 16,
  anchor: { x: 0, y: 0 },
  animations: {
    variantes: { fps: 1, frames: [LISO, TRIZADO, CON_PASTO, ADOQUIN] },
  },
};

/** Relative weights for picking each variant (plain slabs dominate). */
export const SUELO_CENTRO_PESOS = [18, 2, 1, 2] as const;
