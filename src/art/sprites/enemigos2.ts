import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Enemigos de la Fase 3. Animales, objetos, clima y criaturas de la mitología
 * chilena (nunca personas). Miran a la derecha y se espejan en el juego.
 */
const enemy = (name: string, anims: Record<string, { fps: number; frames: Frame[] }>, anchorY = 0.6): SpriteDef => {
  const first = Object.values(anims)[0]?.frames[0] ?? [];
  return {
    name,
    group: 'enemigos',
    width: first[0]?.length ?? 0,
    height: first.length,
    anchor: { x: 0.5, y: anchorY },
    flash: true,
    elite: true,
    animations: anims,
  };
};
const o = (p: Pix): Frame => outlined(p.frame());

// ---- Jote (visto desde arriba, alas abiertas; cabeza pelada roja) ----
const JOTE_A = o(
  new Pix(20, 9).rows(0, 0, [
    '.........rr.........',
    '.........KK.........',
    'KKK.....KKKK.....KKK',
    '.KKKKKKKKKKKKKKKKKK.',
    '..KKgKgKKKKKKgKgKK..',
    '....KKKKKKKKKKKK....',
    '........KKKK........',
    '.........KK.........',
    '........K..K........',
  ]),
);
const JOTE_B = o(
  new Pix(20, 9).rows(0, 0, [
    '.........rr.........',
    '.........KK.........',
    '........KKKK........',
    '..KKKKKKKKKKKKKKKK..',
    '.KKKgKgKKKKKKgKgKKK.',
    'KKK...KKKKKKKK...KKK',
    'K.......KKKK.......K',
    '.........KK.........',
    '........K..K........',
  ]),
);

// ---- Guanaco ----
const GUANACO_ROWS = [
  '..............o.o...',
  '..............ooo...',
  '..............ookoo.',
  '..............ooonn.',
  '..............ooo...',
  '..............ooo...',
  '..............ooo...',
  '.............oooo...',
  '...oooooooooooooo...',
  '..ooooooooooooooo...',
  '.Oooooooooooooooo...',
  '..owwwwwwwwwwwwwo...',
  '...wwwwwwwwwwwww....',
  '...o.o.......o.o....',
];
const GUANACO_A = o(new Pix(20, 17).rows(0, 0, [...GUANACO_ROWS, '...o.o.......o.o....', '...o.o.......o.o....', '...O.O.......O.O....']));
const GUANACO_B = o(new Pix(20, 17).rows(0, 0, [...GUANACO_ROWS, '...o..o.....o..o....', '...o..o.....o..o....', '...O..O.....O..O....']));
const GUANACO_ESCUPE = o(
  new Pix(20, 17).rows(0, 0, [...GUANACO_ROWS, '...o.o.......o.o....', '...o.o.......o.o....', '...O.O.......O.O....']).rows(17, 3, ['rW.']),
);

// ---- Micro (amarilla, sin marcas) ----
const microRows = (a: string, b: string): string[] => [
  '.wwwwwwwwwwwwwwwwwwwwwwwwwww..',
  'yyyyyyyyyyyyyyyyyyyyyyyyyyyyy.',
  'yKKKKyKKKKyKKKKyKKKKyKKKKyssy.',
  'yKKKKyKKKKyKKKKyKKKKyKKKKyssy.',
  'yKKKKyKKKKyKKKKyKKKKyKKKKyssy.',
  'yyyyyyyyyyyyyyyyyyyyyyyyyyyyy.',
  'ybbbbbbbbbbbbbbbbbbbbbbbbbbby.',
  'yyyyyyyyyyyyyyyyyyyyyyyyyyyyW.',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAA.',
  '...kkkk.................kkkk..',
  `..k${a}${b}${a}k...............k${a}${b}${a}k...`,
  `..k${b}${a}${b}k...............k${b}${a}${b}k...`,
  '...kkk.................kkk....',
];
const MICRO_A = o(new Pix(30, 13).rows(0, 0, microRows('G', 'g')));
const MICRO_B = o(new Pix(30, 13).rows(0, 0, microRows('g', 'G')));

// ---- Gaviota de Valpo ----
const GAVIOTA_A = o(
  new Pix(14, 7).rows(0, 0, ['...GG.........', '....GGG.......', '.....GGG..ww..', '..wwwwwwwwwwyy', '.wwwwwwwwwww..', 'GG.wwwwwww....', '......p.p.....']),
);
const GAVIOTA_B = o(
  new Pix(14, 7).rows(0, 0, ['..............', '..............', '..........ww..', '..wwwwwwwwwwyy', '.wwwGGGGwwww..', 'GG.wGGGGGww...', '......GGG.....']),
);

// ---- Lobo marino ----
const lobo = (dy: number, squash: number): Frame =>
  o(
    new Pix(30, 16)
      .ellipse(13, 10 + dy, 13, 5 - squash, 'C')
      .ellipse(13, 8 + dy, 11, 2, 'c')
      .ellipse(23, 5 + dy * 2, 5, 4, 'C')
      .ellipse(23, 4 + dy * 2, 3.5, 2, 'c')
      .rect(26, 5 + dy * 2, 3, 2, 'l')
      .set(24, 3 + dy * 2, 'k')
      .set(28, 7 + dy * 2, 'W')
      .set(29, 6 + dy * 2, 'W')
      .ellipse(19, 14, 3, 1.6, 'd')
      .ellipse(2.5, 14, 2.5, 1.5, 'd'),
  );

// ---- Chonchón (cabeza voladora con orejas-alas) ----
const chonchon = (up: boolean): Frame =>
  o(
    new Pix(14, 12)
      .disc(7, 7, 4.2, 'l')
      .rect(4, 3, 6, 2, 'd')
      .set(5, 7, 'k')
      .set(9, 7, 'k')
      .rect(6, 9, 3, 1, 'R')
      .rows(0, up ? 0 : 6, up ? ['CC..........CC', 'CCC........CCC', '.CCC......CCC.', '..CC......CC..'] : ['..CC......CC..', '.CCC......CCC.', 'CCC........CCC', 'CC..........CC']),
  );

// ---- Camahueto (ternero de un cuerno dorado) ----
const camahueto = (alt: boolean): Frame => {
  const p = new Pix(22, 16)
    .ellipse(10, 8, 8, 4, 'o')
    .ellipse(10, 6, 6, 1.5, 'n')
    .ellipse(18, 6, 3.5, 3, 'o')
    .rows(18, 0, ['..aW', '.aa.', 'aa..'])
    .set(19, 5, 'k')
    .set(21, 7, 'p')
    .rect(0, 5, 2, 1, 'A');
  const legs = alt ? [3, 9, 12, 17] : [5, 7, 14, 15];
  for (const x of legs) p.rect(x, 11, 2, 5, 'A');
  return o(p);
};

// ---- Basilisco chilote (gallo-serpiente) ----
const BASILISCO_TOP = [
  '..........r.r.....',
  '.........rrrrr....',
  '.........wwwww....',
  '........wwykwwyy..',
  '........wwwwwww...',
  '.........rwwww....',
  '..........fff.....',
  '.........fvfff....',
  '........fffvff....',
];
const BASILISCO_A = o(
  new Pix(18, 16).rows(0, 0, [...BASILISCO_TOP, '...fff..ffvfff....', '..fvfff.fffvf.....', '.fff.ffffvfff.....', '.ff...fvffff......', '.fff.fffvff.......', '..fffffvff........', '...ffvfff.........']),
);
const BASILISCO_B = o(
  new Pix(18, 16).rows(0, 0, [
    ...BASILISCO_TOP.map((r, i) => (i === 3 ? '........wwWkwwyy..' : r)),
    '........ffvfff....',
    '.fff...fffvf......',
    'fvfff.ffffvf......',
    'ff..fffvffff......',
    'fff.ffffvf........',
    '.ffffffvff........',
    '..fffvfff.........',
  ]),
);

// ---- Témpano (bloque de hielo enojado) ----
const tempano = (w: number, h: number, shine: number): Frame => {
  const p = new Pix(w, h)
    .rect(1, 2, w - 2, h - 2, 'i')
    .rect(3, 0, w - 6, 2, 'i')
    .rect(1, Math.round(h * 0.65), w - 2, h - Math.round(h * 0.65), 'I')
    .rect(2 + shine, 3, 1, Math.round(h * 0.35), 'W');
  const ex = Math.round(w * 0.3);
  const ey = Math.round(h * 0.4);
  p.set(ex, ey, 'k').set(w - 1 - ex, ey, 'k').set(ex - 1, ey - 1, 'k').set(w - ex, ey - 1, 'k');
  p.rect(Math.round(w * 0.4), Math.round(h * 0.62), Math.max(1, Math.round(w * 0.2)), 1, 'k');
  return o(p);
};

// ---- Chingue ----
const CHINGUE_TOP = ['..KK............', '.KwwK...........', 'KKwKK...........', 'KwKK....KKKK....', '.KK..KKKwwwwKK..', '....KKKwwwwKKKKp', '....KKKKKKKKKKK.'];
const CHINGUE_A = o(new Pix(16, 8).rows(0, 0, [...CHINGUE_TOP, '.....K.K....K.K.']));
const CHINGUE_B = o(new Pix(16, 8).rows(0, 0, [...CHINGUE_TOP, '......K.K..K.K..']));

// ---- Puma (élite de la Patagonia) ----
const puma = (pose: 'a' | 'b' | 'salto'): Frame => {
  const p = new Pix(22, 12)
    .ellipse(10, 6, 8, pose === 'salto' ? 2.5 : 3, 'o')
    .ellipse(10, 8, 6, 1.2, 'n')
    .disc(18, 4, 3, 'o')
    .set(17, 0, 'C')
    .set(19, 0, 'C')
    .set(19, 4, 'k')
    .set(21, 5, 'p')
    .rows(0, 1, ['oo..', '.o..', '.o..', '..oo']);
  const legs =
    pose === 'salto'
      ? [
          [1, 8, 4, 1],
          [16, 8, 5, 1],
        ]
      : pose === 'a'
        ? [
            [4, 8, 2, 4],
            [7, 8, 2, 4],
            [13, 8, 2, 4],
            [16, 8, 2, 4],
          ]
        : [
            [3, 8, 2, 4],
            [8, 8, 2, 4],
            [12, 8, 2, 4],
            [17, 8, 2, 4],
          ];
  for (const [x, y, w, h] of legs) p.rect(x ?? 0, y ?? 0, w ?? 1, h ?? 1, 'o');
  return o(p);
};

export const enemigosFase3: SpriteDef[] = [
  enemy('jote', { volar: { fps: 6, frames: [JOTE_A, JOTE_B] } }, 0.5),
  enemy('guanaco', { caminar: { fps: 6, frames: [GUANACO_A, GUANACO_B] }, escupir: { fps: 6, frames: [GUANACO_ESCUPE] } }, 0.9),
  enemy('micro', { andar: { fps: 10, frames: [MICRO_A, MICRO_B] } }, 0.9),
  enemy('gaviota', { volar: { fps: 8, frames: [GAVIOTA_A, GAVIOTA_B] } }, 0.6),
  enemy('loboMarino', { arrastrarse: { fps: 4, frames: [lobo(0, 0), lobo(1, 0.6)] }, aplastar: { fps: 1, frames: [lobo(2, 1.4)] } }, 0.85),
  enemy('chonchon', { volar: { fps: 10, frames: [chonchon(true), chonchon(false)] } }, 0.6),
  enemy('camahueto', { caminar: { fps: 8, frames: [camahueto(false), camahueto(true)] } }, 0.85),
  enemy('basilisco', { reptar: { fps: 4, frames: [BASILISCO_A, BASILISCO_B] } }, 0.85),
  enemy('tempano', { deslizar: { fps: 3, frames: [tempano(20, 18, 0), tempano(20, 18, 1)] } }, 0.85),
  enemy('tempanito', { deslizar: { fps: 3, frames: [tempano(10, 9, 0), tempano(10, 9, 1)] } }, 0.8),
  enemy('chingue', { correr: { fps: 10, frames: [CHINGUE_A, CHINGUE_B] } }, 0.8),
  enemy('puma', { caminar: { fps: 8, frames: [puma('a'), puma('b')] }, saltar: { fps: 1, frames: [puma('salto')] } }, 0.85),
];

/** Enemy projectiles are always rojo copihue with a white pixel in the centre (GDD). */
const PROYECTIL = outlined(new Pix(4, 4).disc(2, 2, 2, 'r').rect(1, 1, 2, 2, 'W').frame());
const PEPITA = outlined(new Pix(4, 4).disc(2, 2, 2, 'a').set(1, 1, 'W').set(2, 2, 'y').frame());
const ROCA = outlined(new Pix(8, 7).ellipse(4, 3.5, 4, 3.5, 'm').ellipse(3, 2.5, 2, 1.5, 'n').ellipse(5, 5, 2.5, 1.2, 'M').frame());
const NUBE = new Pix(14, 10)
  .ellipse(7, 5, 7, 5, 'v')
  .ellipse(5, 4, 3, 2, 'V')
  .ellipse(10, 6, 3, 2, 'f')
  .frame()
  .map((r, y) => [...r].map((c, x) => ((x + y) % 2 === 0 ? c : '.')).join(''));

export const proyectiles: SpriteDef = {
  name: 'proyectil',
  group: 'efectos',
  width: 6,
  height: 6,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    rojo: { fps: 1, frames: [PROYECTIL] },
    pepita: { fps: 1, frames: [PEPITA] },
  },
};

export const roca: SpriteDef = {
  name: 'roca',
  group: 'efectos',
  width: 10,
  height: 9,
  anchor: { x: 0.5, y: 0.5 },
  animations: { caer: { fps: 1, frames: [ROCA] } },
};

export const nubeToxica: SpriteDef = {
  name: 'nube',
  group: 'efectos',
  width: 14,
  height: 10,
  anchor: { x: 0.5, y: 0.5 },
  animations: { flotar: { fps: 1, frames: [NUBE] } },
};

/** Remolino de polvo (peligro del Norte): espiral de píxeles de arena. */
const remolino = (k: number): Frame => {
  const p = new Pix(14, 20);
  for (let y = 0; y < 20; y++) {
    const r = 1.5 + y * 0.28;
    for (let i = 0; i < 3; i++) {
      const a = y * 0.7 + k * 2.1 + (i * Math.PI * 2) / 3;
      p.set(7 + Math.cos(a) * r, 19 - y, i === 0 ? 'n' : 'o');
    }
  }
  return p.frame();
};

export const remolinoDef: SpriteDef = {
  name: 'remolino',
  group: 'efectos',
  width: 14,
  height: 20,
  anchor: { x: 0.5, y: 1 },
  animations: { girar: { fps: 12, frames: [remolino(0), remolino(1), remolino(2)] } },
};
