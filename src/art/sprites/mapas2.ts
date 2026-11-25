import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';
import type { DecoAmbiente } from './mapas.ts';

/*
 * Fase 11.1b, segunda tanda — el Sur: el bosque lluvioso de la Araucanía y los lagos y palafitos
 * de Chiloé. Todo original y genérico (plantas, casas de madera, botes), sin marcas.
 */
const deco = (name: string, frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

// ---------------------------------------------------------------- Araucanía

/** A coihue: a broad evergreen with a thick mossy trunk and layered dark foliage. */
const COIHUE = ((): Frame => {
  const p = new Pix(34, 48);
  p.rect(14, 26, 6, 22, 'd').rect(14, 26, 2, 22, 'C').rect(19, 30, 1, 18, 'k');
  p.rect(12, 44, 10, 4, 'd').rect(11, 46, 12, 2, 'd');
  for (const [cx, cy, rx, ry, c] of [
    [17, 10, 14, 7, 'F'],
    [10, 18, 10, 6, 'f'],
    [24, 18, 10, 6, 'f'],
    [17, 22, 13, 6, 'F'],
    [17, 6, 9, 5, 'f'],
  ] as const) p.ellipse(cx, cy, rx, ry, c);
  for (let i = 0; i < 22; i++) p.set(6 + ((i * 7) % 22), 4 + ((i * 5) % 22), i % 3 === 0 ? 'v' : 'V');
  return outlined(p.frame());
})();

const HELECHO = ((): Frame => {
  const p = new Pix(22, 14);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9;
    for (let s = 1; s < 10; s++) {
      const x = 11 + Math.cos(a) * s * 1.05;
      const y = 13 + Math.sin(a) * s * 1.05 + s * s * 0.05;
      p.set(x, y, 'v').set(x, y + 1, 'f');
      if (s % 2 === 0) p.set(x + 1, y - 1, 'V').set(x - 1, y - 1, 'V');
    }
  }
  return outlined(p.frame());
})();

const TRONCO = outlined(
  new Pix(32, 13)
    .rect(2, 3, 28, 8, 'C')
    .rect(2, 3, 28, 2, 'o')
    .rect(2, 9, 28, 2, 'd')
    .ellipse(3, 7, 2.6, 4, 'o')
    .ellipse(3, 7, 1.2, 2, 'C')
    .rect(10, 2, 8, 2, 'v')
    .rect(22, 3, 5, 2, 'V')
    .rect(7, 5, 1, 4, 'd')
    .rect(16, 5, 1, 4, 'd')
    .frame(),
);

const HONGOS = outlined(
  new Pix(16, 12)
    .rect(3, 6, 2, 5, 'w')
    .ellipse(4, 5, 4, 3, 'r')
    .rect(0, 5, 9, 4, '.')
    .ellipse(4, 4.4, 3.6, 2.6, 'r')
    .set(3, 3, 'w')
    .set(5, 4, 'w')
    .rect(11, 8, 2, 3, 'w')
    .ellipse(12, 8, 3, 2, 'a')
    .rect(9, 8, 7, 3, '.')
    .ellipse(12, 7.3, 2.8, 1.8, 'a')
    .set(12, 6, 'W')
    .frame(),
);

/** A ruka: a round-roofed hut of thatch and wood, with a low door. */
const RUKA = ((): Frame => {
  const p = new Pix(36, 28);
  p.ellipse(18, 22, 17, 12, 'A').rect(0, 22, 36, 6, '.');
  p.ellipse(18, 22, 17, 12, 'o').rect(0, 22, 36, 6, '.');
  p.rect(1, 18, 34, 10, 'd').rect(1, 18, 34, 2, 'C');
  for (let x = 2; x < 34; x += 3) p.rect(x, 20, 1, 8, 'k');
  p.rect(14, 19, 8, 9, 'k').rect(15, 20, 6, 8, 'K');
  for (let y = 7; y < 18; y += 3) for (let x = 4 + (y % 2) * 2; x < 33; x += 4) p.set(x, y, 'A');
  p.rect(17, 0, 2, 6, 'k').set(17, 0, 'g');
  return outlined(p.frame());
})();

// ---------------------------------------------------------------- Lagos y Chiloé

/** A palafito: a wooden house on stilts over the water, with a shingled roof and a little pier. */
const palafito = (wall: string, shade: string, door: string): Frame => {
  const p = new Pix(40, 38);
  for (const x of [5, 12, 22, 29]) p.rect(x, 26, 2, 12, 'd').rect(x, 26, 1, 12, 'C');
  p.rect(1, 25, 38, 2, 'C').rect(1, 27, 38, 1, 'd');
  p.rect(4, 12, 28, 13, wall).rect(4, 12, 28, 1, shade).rect(4, 24, 28, 1, shade);
  for (let x = 7; x < 31; x += 5) p.rect(x, 13, 1, 11, shade);
  p.rect(6, 15, 5, 5, 'w').rect(7, 16, 3, 3, 'k').rect(21, 15, 5, 5, 'w').rect(22, 16, 3, 3, 'k');
  p.rect(14, 16, 5, 9, door).rect(14, 16, 5, 1, 'k');
  // Shingled roof, in rows of rounded tiles.
  for (let y = 0; y < 6; y++) p.rect(3 - y * 0.5, 6 + y, 30 + y, 1, y % 2 ? 'O' : 'o');
  p.rect(2, 11, 32, 1, 'd').rect(16, 2, 2, 4, 'k').rect(17, 1, 4, 2, 'g');
  // The pier running out over the water.
  p.rect(32, 24, 8, 1, 'C').rect(34, 25, 1, 8, 'd').rect(38, 25, 1, 8, 'd');
  return outlined(p.frame());
};

const BOTE_MADERA = outlined(
  new Pix(32, 14)
    .ellipse(16, 7, 15, 6, 'C')
    .rect(0, 0, 32, 5, '.')
    .ellipse(16, 4, 14, 2.4, 'd')
    .rect(0, 5, 32, 2, 'o')
    .rect(0, 7, 32, 1, 'r')
    .rect(5, 8, 22, 4, 'C')
    .rect(5, 8, 22, 1, 'o')
    .rect(24, 0, 1, 6, 'd')
    .rect(18, 0, 1, 5, 'd')
    .rect(18, 0, 6, 2, 'w')
    .frame(),
);

const MUELLE = outlined(
  new Pix(34, 16)
    .rect(0, 4, 34, 3, 'C')
    .rect(0, 4, 34, 1, 'o')
    .rect(0, 7, 34, 1, 'd')
    .rect(2, 7, 2, 8, 'd')
    .rect(12, 7, 2, 8, 'd')
    .rect(22, 7, 2, 8, 'd')
    .rect(30, 7, 2, 8, 'd')
    .rect(0, 0, 2, 5, 'd')
    .rect(32, 0, 2, 5, 'd')
    .rect(0, 1, 34, 1, 'C')
    .frame(),
);

/** A small pond that mirrors the sky: flat on the ground, with reeds around it. */
const LAGUITO = ((): Frame => {
  const p = new Pix(48, 20);
  p.ellipse(24, 10, 23, 8.5, 'B').ellipse(24, 10, 21, 7, 'b').ellipse(24, 9, 18, 5, 's');
  for (const [x, y] of [[12, 8], [30, 6], [22, 12], [36, 11]] as const) p.rect(x, y, 5, 1, 'W');
  for (const x of [2, 5, 40, 44]) p.rect(x, 3, 1, 6, 'v').set(x, 2, 'V');
  return outlined(p.frame());
})();

const JUNCO = outlined(
  new Pix(16, 18)
    .rect(2, 6, 2, 12, 'v')
    .rect(2, 6, 1, 12, 'V')
    .rect(7, 2, 2, 16, 'v')
    .rect(7, 2, 1, 16, 'V')
    .rect(12, 7, 2, 11, 'v')
    .rect(12, 7, 1, 11, 'V')
    .rect(2, 3, 2, 4, 'C')
    .rect(7, 0, 2, 4, 'C')
    .rect(12, 4, 2, 4, 'C')
    .rect(4, 12, 3, 6, 'f')
    .rect(9, 10, 3, 8, 'f')
    .frame(),
);
const BARRIL = outlined(
  new Pix(12, 14)
    .rect(1, 2, 10, 11, 'C')
    .rect(1, 2, 10, 2, 'o')
    .rect(1, 5, 10, 1, 'k')
    .rect(1, 9, 10, 1, 'k')
    .rect(2, 0, 8, 2, 'd')
    .frame(),
);

const ovejaFrame = (step: number): Frame => {
  const p = new Pix(24, 18);
  p.ellipse(11, 8, 8.5, 6, 'W').ellipse(9, 6, 6, 3.4, 'w').ellipse(7, 9, 4, 3, 'W').ellipse(15, 9, 4, 3, 'W');
  p.rect(18, 4, 5, 5, 'k').rect(19, 5, 3, 3, 'K').set(20, 5, 'W');
  const a = step === 0 ? 0 : 1;
  p.rect(6 + a, 13, 1, 4, 'k').rect(9 - a, 13, 1, 4, 'k').rect(13 + a, 13, 1, 4, 'k').rect(16 - a, 13, 1, 4, 'k');
  return outlined(p.frame());
};

export const ovejaDef: SpriteDef = {
  name: 'oveja',
  group: 'decoracion',
  width: 26,
  height: 20,
  anchor: { x: 0.5, y: 1 },
  animations: { caminar: { fps: 3, frames: [ovejaFrame(0), ovejaFrame(1)] } },
};

export const mapasSurSprites: SpriteDef[] = [
  deco('coihue', COIHUE),
  deco('helecho', HELECHO),
  deco('tronco', TRONCO),
  deco('hongos', HONGOS),
  deco('ruka', RUKA),
  deco('palafito', palafito('b', 'B', 'r')),
  deco('palafito2', palafito('y', 'A', 'b')),
  deco('palafito3', palafito('p', 'R', 't')),
  deco('bote_madera', BOTE_MADERA),
  deco('muelle', MUELLE),
  deco('laguito', LAGUITO),
  deco('junco', JUNCO),
  deco('barril', BARRIL),
  ovejaDef,
];

export const DECO_SUR: Readonly<Record<string, DecoAmbiente>> = {
  // The forest of the Araucanía: araucarias and coihues, fallen logs, ferns and mushrooms under them.
  araucania: {
    big: ['araucaria', 'coihue', 'ruka', 'coihue'],
    medium: ['coihue', 'tronco', 'araucaria', 'copihue', 'coihue'],
    small: ['helecho', 'hongos', 'copihue', 'helecho'],
    cuts: [0.18, 0.42, 0.7],
  },
  // The lakes and Chiloé: stilt houses, wooden churches, boats, piers, ponds and reeds.
  lagos: {
    big: ['palafito', 'palafito2', 'palafito3', 'iglesia'],
    medium: ['laguito', 'bote_madera', 'muelle', 'barril', 'laguito'],
    small: ['junco', 'junco', 'copihue', 'barril'],
    cuts: [0.15, 0.34, 0.52],
  },
};
