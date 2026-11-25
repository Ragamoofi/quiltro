import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';
import type { DecoAmbiente } from './mapas.ts';

/*
 * Fase 11.1b, tercera tanda — Patagonia (estepa, viento, estancias, lagunas glaciares) y La
 * Antártica (hielo, pingüinos, focas, un campamento). Todo original y genérico.
 */
const deco = (name: string, frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

const walker = (name: string, w: number, h: number, frames: Frame[], fps: number): SpriteDef => ({
  name,
  group: 'decoracion',
  width: w,
  height: h,
  anchor: { x: 0.5, y: 1 },
  animations: { caminar: { fps, frames } },
});

// ---------------------------------------------------------------- Patagonia

/** Calafate: a thorny bush with dark blue berries (whoever eats them returns to Patagonia). */
const CALAFATE = ((): Frame => {
  const p = new Pix(20, 14);
  p.ellipse(10, 8, 9, 5.5, 'f').ellipse(9, 6, 7, 3.5, 'v').rect(0, 11, 20, 3, '.');
  for (const [x, y] of [[5, 6], [9, 4], [13, 7], [8, 9], [15, 9], [4, 9]] as const) p.rect(x, y, 2, 2, 'B').set(x, y, 'b');
  p.rect(8, 11, 3, 3, 'd');
  return outlined(p.frame());
})();

/** Lenga: a southern beech in autumn colours, bent by the wind. */
const LENGA = ((): Frame => {
  const p = new Pix(34, 44);
  p.rect(14, 22, 5, 22, 'd').rect(14, 22, 2, 22, 'C').rect(13, 40, 7, 4, 'd');
  p.rect(10, 18, 4, 2, 'd').rect(19, 16, 5, 2, 'd');
  for (const [cx, cy, rx, ry, c] of [
    [20, 10, 12, 7, 'O'],
    [11, 15, 9, 6, 'A'],
    [25, 17, 8, 5, 'r'],
    [17, 7, 8, 5, 'o'],
    [12, 9, 6, 4, 'a'],
  ] as const) p.ellipse(cx, cy, rx, ry, c);
  for (let i = 0; i < 14; i++) p.set(7 + ((i * 7) % 24), 4 + ((i * 5) % 16), i % 2 ? 'y' : 'R');
  return outlined(p.frame());
})();

const ROCA_GRANITO = outlined(
  new Pix(30, 18)
    .rows(0, 0, [
      '........WWWW.................',
      '......WWGGGGGg...............',
      '....WWGGGGGGGggg.....GGg.....',
      '...WGGGGGGGGGgggg...WGGGgg...',
      '..WGGGGGGGGGGgggg..WGGGGGgg..',
      '..GGGGGGGGGgggggggGGGGGGgggg.',
      '.GGGGGGGGgggggggggGGGGGggggg.',
      '.GGGGGggggggggggggGGGgggggggK',
      'GGGgggggggggggggggggggggggggK',
      'gggggggKKggggggggggKKggggKKKK',
      '.KKKKKKKKKKKKKKKKKKKKKKKKKKK.',
    ])
    .frame(),
);

/** An estancia: a farmhouse with a red tin roof, a chimney and a woodpile. */
const ESTANCIA = ((): Frame => {
  const p = new Pix(44, 32);
  p.rect(2, 14, 36, 18, 'w').rect(2, 14, 36, 1, 'G').rect(2, 30, 36, 2, 'g');
  for (let y = 0; y < 7; y++) p.rect(1 + y, 7 + y, 38 - y * 2, 1, y % 2 ? 'R' : 'r');
  p.rect(0, 13, 40, 1, 'R');
  p.rect(30, 1, 4, 8, 'K').rect(29, 0, 6, 2, 'g');
  for (const x of [6, 14, 26]) p.rect(x, 18, 5, 6, 'k').rect(x + 1, 19, 3, 4, 's').rect(x + 2, 19, 1, 4, 'w');
  p.rect(19, 21, 5, 11, 'd').set(22, 27, 'a');
  p.rect(39, 24, 5, 8, 'C').rect(39, 24, 5, 1, 'o').rect(40, 26, 3, 1, 'd').rect(40, 29, 3, 1, 'd');
  return outlined(p.frame());
})();

/** Windmill of the estancias: a lattice tower with a many-bladed wheel and a tail vane. */
const MOLINO = ((): Frame => {
  const p = new Pix(30, 50);
  for (let y = 18; y < 50; y++) {
    const half = 2 + Math.floor((y - 18) * 0.22);
    p.set(15 - half, y, 'K').set(15 + half, y, 'K');
    if (y % 6 === 0) p.rect(15 - half, y, half * 2 + 1, 1, 'K');
  }
  p.rect(14, 12, 3, 8, 'g').disc(15, 10, 9, 'G').disc(15, 10, 7, '.');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (let s = 1; s < 8; s++) p.set(15 + Math.cos(a) * s, 10 + Math.sin(a) * s, i % 2 ? 'W' : 'G');
  }
  p.disc(15, 10, 1.4, 'k').rect(15, 8, 13, 1, 'k').rect(24, 4, 5, 5, 'r');
  p.rect(10, 46, 10, 4, 'd');
  return outlined(p.frame());
})();

/** A glacial lagoon: flat, milky turquoise, with ice floating in it. */
const LAGUNA_GLACIAR = ((): Frame => {
  const p = new Pix(52, 22);
  p.ellipse(26, 11, 25, 9.5, 'I').ellipse(26, 11, 23, 8, 't').ellipse(26, 10, 19, 5.5, 'i');
  p.rect(10, 9, 7, 2, 'W').rect(28, 7, 8, 2, 'W').rect(19, 13, 5, 2, 'W').rect(38, 12, 5, 2, 'W').rect(30, 8, 3, 1, 'i');
  return outlined(p.frame());
})();

const guanacoFrame = (step: number): Frame => {
  const p = new Pix(28, 28);
  p.ellipse(13, 17, 9, 5.5, 'o').ellipse(13, 20, 8, 2.6, 'w').rect(18, 5, 3, 13, 'o').rect(18, 5, 1, 13, 'l');
  p.ellipse(21, 4, 3.4, 2.4, 'w').rect(21, 3, 5, 3, 'w').set(22, 3, 'k').rect(19, 0, 1, 3, 'o').rect(21, 0, 1, 2, 'o');
  p.rect(2, 14, 3, 2, 'o');
  const a = step === 0 ? 0 : 1;
  p.rect(7 + a, 21, 1, 7, 'C').rect(10 - a, 21, 1, 7, 'C').rect(15 + a, 21, 1, 7, 'C').rect(18 - a, 21, 1, 7, 'C');
  return outlined(p.frame());
};

const nanduFrame = (step: number): Frame => {
  const p = new Pix(26, 26);
  p.ellipse(11, 14, 8, 5, 'g').ellipse(10, 12, 6, 3, 'G').rect(17, 4, 2, 11, 'g').ellipse(19, 3, 2.6, 2, 'g').rect(20, 3, 4, 1, 'a').set(19, 2, 'k');
  p.rect(2, 13, 4, 2, 'G');
  const a = step === 0 ? 0 : 3;
  p.rect(9 + a, 19, 1, 7, 'd').rect(14 - a, 19, 1, 7, 'd').rect(9 + a, 25, 3, 1, 'd').rect(14 - a, 25, 3, 1, 'd');
  return outlined(p.frame());
};

// ---------------------------------------------------------------- La Antártica

const pinguinoFrame = (step: number): Frame => {
  const p = new Pix(14, 18);
  p.ellipse(7, 9, 5, 7.5, 'k').ellipse(7, 11, 3.4, 5.2, 'W').rect(3, 4, 2, 2, 'k').ellipse(7, 3.4, 3.2, 3, 'k');
  p.rect(9, 3, 3, 1, 'a').set(6, 3, 'W').rect(5, 13, 1, 1, 'K');
  const a = step === 0 ? 0 : 1;
  p.rect(1, 8 + a, 2, 5, 'k').rect(11, 8 + (1 - a), 2, 5, 'k');
  p.rect(4 - a, 16, 3, 2, 'a').rect(7 + a, 16, 3, 2, 'a');
  return outlined(p.frame());
};

const COLONIA = ((): Frame => {
  const p = new Pix(40, 18);
  for (const [x, h] of [[3, 12], [10, 14], [18, 11], [25, 14], [32, 12]] as const) {
    p.ellipse(x + 3, 18 - h / 2, 3.2, h / 2, 'k').ellipse(x + 3, 18 - h / 2 + 1, 2, h / 2 - 2, 'W').rect(x + 5, 18 - h + 2, 2, 1, 'a');
  }
  return outlined(p.frame());
})();

const FOCA = outlined(
  new Pix(32, 12)
    .ellipse(14, 7, 13, 4, 'G')
    .ellipse(14, 8, 11, 2.2, 'w')
    .ellipse(27, 5, 3.6, 3, 'G')
    .rect(29, 5, 3, 2, 'g')
    .set(27, 3, 'k')
    .set(31, 5, 'k')
    .rect(0, 6, 4, 2, 'g')
    .rect(4, 9, 6, 2, 'g')
    .rect(10, 6, 8, 1, 'g')
    .frame(),
);

const ICEBERG = ((): Frame => {
  const p = new Pix(44, 40);
  p.rows(0, 0, [
    '...................WW.................',
    '................WWWWii................',
    '.............WWWWiiiiii...............',
    '...........WWWWiiiiiiiii..............',
    '.........WWWWiiiiiiiiiiii....WW.......',
    '.......WWWWiiiiiiiiiiiiiii.WWWii......',
    '......WWWiiiiiiiiiiiIIIIiiWWiiiii.....',
    '.....WWiiiiiiiiiiiiIIIIIIiiiiiiiiii...',
    '....WWiiiiiiiiiiiiIIIIIIIIiiiiiiiIII..',
    '...WWiiiiiiiiiiiiIIIIIIIIIIiiiiiIIIII.',
    '...WiiiiiiiiiiiiIIIIIIIIIIIIiiiIIIIIII',
    '...iiiiiiiiiiiiIIIIIIIIIIIIIIIIIIIIIII',
    '...iiiiiiiiiiiIIIIIIIIIIIIIIIIIIIIIIIs',
    '...iiiiiiiiiiIIIIIIIIIIIIIIIIIIIIIIIIs',
    '....iiiiiiiiIIIIIIIIIIIIIIIIIIIIIIIIss',
    '....iiiiiiIIIIIIIIIIIIIIIIIIIIIIIIIIss',
    '.....IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIss.',
    '......sIIIIIIIIIIIIIIIIIIIIIIIIIIIIss.',
    '.......ssIIIIIIIIIIIIIIIIIIIIIIIIsss..',
  ]);
  return outlined(p.frame());
})();

const CARPA = outlined(
  new Pix(26, 18)
    .rows(0, 0, [
      '..........oo..............',
      '........oooooo............',
      '......ooooooooOO..........',
      '.....oooooooooOOOO........',
      '...oooooooooooOOOOOO......',
      '..ooooooooooooOOOOOOOO....',
      '.oooooooooooooOOOOOOOOOO..',
      'ooooooooooooooOOOOOOOOOOOO',
      'oooooooookkkkkOOOOOOOOOOOO',
      'oooooooookKKKkOOOOOOOOOOOO',
      'oooooooookKKKkOOOOOOOOOOOO',
      'dddddddddkkkkkdddddddddddd',
    ])
    .rect(12, 0, 1, 2, 'k')
    .rect(13, 0, 3, 2, 'r')
    .frame(),
);

export const mapasPatagoniaSprites: SpriteDef[] = [
  deco('calafate', CALAFATE),
  deco('lenga', LENGA),
  deco('roca_granito', ROCA_GRANITO),
  deco('estancia', ESTANCIA),
  deco('molino', MOLINO),
  deco('laguna_glaciar', LAGUNA_GLACIAR),
  walker('guanacoPaz', 30, 30, [guanacoFrame(0), guanacoFrame(1)], 3),
  walker('nandu', 28, 28, [nanduFrame(0), nanduFrame(1)], 6),
  walker('pinguinoAmb', 16, 20, [pinguinoFrame(0), pinguinoFrame(1)], 4),
  deco('colonia', COLONIA),
  deco('foca', FOCA),
  deco('iceberg', ICEBERG),
  deco('carpa', CARPA),
];

export const DECO_EXTREMO: Readonly<Record<string, DecoAmbiente>> = {
  // Patagonia: wind-bent lengas, calafate and granite on the steppe, with estancias, windmills and glacial lagoons.
  patagonia: {
    big: ['estancia', 'molino', 'lenga', 'cerco'],
    medium: ['lenga', 'laguna_glaciar', 'roca_granito', 'hielo', 'molino', 'lenga'],
    small: ['coiron', 'calafate', 'coiron', 'roca_granito'],
    cuts: [0.09, 0.27, 0.5],
  },
  // La Antártica: icebergs and cracks, penguin colonies, seals and a lonely camp.
  antartica: {
    big: ['iceberg', 'iceberg', 'carpa'],
    medium: ['colonia', 'foca', 'grieta', 'hielo'],
    small: ['hielo', 'grieta', 'colonia'],
    cuts: [0.08, 0.24, 0.44],
  },
};
