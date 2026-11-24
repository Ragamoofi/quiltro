import { Pix } from '../draw.ts';
import { outlined, recolor, silhouette, type Frame, type SpriteDef } from '../types.ts';

/*
 * La Cucha: la casita del quiltro, los 12 objetos que son las mejoras, los
 * vecinos (personajes ficticios del barrio) y los moais amistosos del logro
 * secreto Guardianes.
 */
const o = (p: Pix): Frame => outlined(p.frame());

const OBJETOS: Record<string, Frame> = {
  platoLleno: o(new Pix(14, 10).ellipse(7, 6, 7, 3.5, 'r').ellipse(7, 5, 6, 2, 'R').ellipse(7, 4.5, 4.5, 1.6, 'o').set(5, 4, 'A').set(9, 4, 'A').rect(2, 8, 10, 1, 'R')),
  frazada: o(
    new Pix(16, 12).rows(0, 0, Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, (_, x) => ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? 'r' : 'w')).join(''))),
  ),
  pelota: o(new Pix(12, 12).disc(6, 6, 6, 'y').rect(0, 5, 12, 2, 'r').disc(10.5, 2, 2.2, '.').set(3, 2, 'W')),
  huesoDeCaracu: o(new Pix(16, 8).rect(3, 3, 10, 2, 'w').disc(2, 2, 2, 'w').disc(2, 6, 2, 'w').disc(14, 2, 2, 'w').disc(14, 6, 2, 'w').rect(3, 4, 10, 1, 'n')),
  narizHumeda: o(new Pix(14, 14).rect(0, 0, 14, 14, 'd').rect(2, 2, 10, 10, 'w').ellipse(7, 7.5, 4, 3, 'K').rect(5, 8, 1, 1, 'k').rect(8, 8, 1, 1, 'k').set(6, 6, 'G')),
  collarNuevo: o(new Pix(14, 14).disc(7, 6, 6, 'b').disc(7, 6, 4, '.').rect(6, 10, 3, 4, 'a').set(7, 11, 'y')),
  volantinExtra: o(new Pix(12, 14).rows(0, 0, ['.....r......', '....rrw.....', '...rrrww....', '..rrrrwww...', '.rrrrrwwww..', '..rrrrwww...', '...rrrww....', '....rrw.....', '.....r......', '.....w......', '......w.....', '.....w......', '......w.....', '.....d......'])),
  buenaOnda: o(new Pix(12, 12).rows(0, 0, ['.GG......GG.', 'GgG......GgG', 'GgG......GgG', 'GgG......GgG', 'GgG......GgG', 'GgGG....GGgG', '.GgGG..GGgG.', '..GgGGGGgG..', '...GGGGGG...', '............', '............', '............'])),
  otraMano: o(new Pix(10, 14).rect(0, 0, 10, 14, 'w').rect(1, 1, 8, 1, 'G').rows(2, 4, ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'])),
  cuartaCarta: o(new Pix(16, 12).rect(0, 2, 16, 3, 'o').rect(0, 2, 16, 1, 'l').rect(2, 5, 2, 7, 'd').rect(12, 5, 2, 7, 'd').rect(5, 0, 3, 3, 'w').rect(9, 0, 3, 3, 'w')),
  segundaVida: o(new Pix(12, 16).rect(3, 0, 2, 6, 'b').rect(7, 0, 2, 6, 'r').disc(6, 10, 5, 'a').disc(6, 10, 3, 'y').set(5, 9, 'W')),
  cuentaRut: o(new Pix(16, 12).ellipse(8, 6.5, 7.5, 5, 'p').disc(14, 6, 2, 'p').rect(15, 5, 1, 1, 'r').set(11, 4, 'k').rect(6, 1, 4, 1, 'k').rect(3, 10, 2, 2, 'p').rect(10, 10, 2, 2, 'p').set(1, 5, 'p')),
};

export const objetosCucha: SpriteDef = {
  name: 'objeto',
  group: 'decoracion',
  width: 18,
  height: 18,
  anchor: { x: 0.5, y: 1 },
  animations: Object.fromEntries(
    Object.entries(OBJETOS).map(([id, f]) => {
      // Pad every object to 18×18, sitting on the bottom edge.
      const w = f[0]?.length ?? 0;
      const h = f.length;
      const left = Math.floor((18 - w) / 2);
      const rows = Array.from({ length: 18 }, (_, y) => {
        const src = f[y - (18 - h)];
        return src ? '.'.repeat(left) + src + '.'.repeat(18 - w - left) : '.'.repeat(18);
      });
      return [id, { fps: 1, frames: [rows] }];
    }),
  ),
};

const CUCHA_FRAME = o(
  new Pix(54, 42)
    .rows(0, 0, Array.from({ length: 14 }, (_, y) => '.'.repeat(Math.max(0, 26 - y * 2)) + 'r'.repeat(Math.min(54, 2 + y * 4)) + '.'.repeat(Math.max(0, 26 - y * 2))).map((r) => r.slice(0, 54)))
    .rows(0, 13, ['R'.repeat(54)])
    .rect(4, 14, 46, 28, 'o')
    .rect(4, 14, 2, 28, 'l')
    .rows(4, 18, ['A'.repeat(46)])
    .rows(4, 24, ['A'.repeat(46)])
    .rows(4, 30, ['A'.repeat(46)])
    .rows(4, 36, ['A'.repeat(46)])
    .ellipse(27, 34, 9, 11, 'k')
    .rect(18, 34, 18, 8, 'k')
    .rect(20, 16, 14, 5, 'w')
    .rows(22, 17, ['r.r.r.r.r.', '.r.r.r.r.r']),
);

export const cuchaDef: SpriteDef = {
  name: 'cucha',
  group: 'decoracion',
  width: CUCHA_FRAME[0]?.length ?? 0,
  height: CUCHA_FRAME.length,
  anchor: { x: 0.5, y: 1 },
  animations: { quieto: { fps: 1, frames: [CUCHA_FRAME] } },
};

/** A neighbour: round head, body with clothes, little legs. Waves in frame 2. */
function vecino(skin: string, hair: string, top: string, bottom: string, extra: (p: Pix) => void, wave: boolean): Frame {
  const p = new Pix(14, 22);
  p.disc(7, 5, 4, skin).rect(3, 1, 8, 3, hair).set(5, 5, 'k').set(9, 5, 'k').rect(6, 7, 3, 1, 'R');
  p.rect(3, 9, 8, 8, top).rect(4, 17, 6, 2, bottom).rect(4, 19, 2, 3, 'K').rect(8, 19, 2, 3, 'K');
  p.rect(1, 10, 2, 5, top).rect(1, 15, 2, 1, skin);
  if (wave) p.rect(11, 5, 2, 5, top).rect(11, 4, 2, 1, skin);
  else p.rect(11, 10, 2, 5, top).rect(11, 15, 2, 1, skin);
  extra(p);
  return o(p);
}

const VECINOS: Record<string, [Frame, Frame]> = {
  almacen: [false, true].map((w) => vecino('l', 'G', 'p', 'b', (p) => p.rect(4, 11, 6, 6, 'w'), w)) as [Frame, Frame],
  // Brown cardigan and a ring of keys (no uniform or cap: nothing that reads as police).
  conserje: [false, true].map((w) => vecino('c', 'K', 'O', 'd', (p) => p.rect(6, 9, 2, 8, 'o').set(4, 15, 'G').set(5, 16, 'a').set(3, 16, 'G'), w)) as [Frame, Frame],
  feria: [false, true].map((w) => vecino('C', 'd', 't', 'B', (p) => p.rect(4, 11, 6, 6, 'v').set(6, 13, 'r').set(8, 14, 'y'), w)) as [Frame, Frame],
  tiaOnce: [false, true].map((w) => vecino('l', 'w', 't', 'p', (p) => p.rect(3, 9, 8, 2, 'T').set(12, 15, 'w').set(12, 16, 'o'), w)) as [Frame, Frame],
};

export const vecinosDef: SpriteDef = {
  name: 'vecino',
  group: 'personajes',
  width: 16,
  height: 24,
  anchor: { x: 0.5, y: 1 },
  animations: Object.fromEntries(
    Object.entries(VECINOS).flatMap(([id, frames]) => [
      [id, { fps: 2, frames }],
      // Not befriended yet: a dark silhouette in the doorway.
      [`${id}_sombra`, { fps: 1, frames: [silhouette(frames[0], 'K')] }],
    ]),
  ),
};

/** Moai: friendly guardian of the secret route to Rapa Nui (shown with respect, never an enemy). */
const MOAI = o(
  new Pix(14, 28)
    .rect(2, 0, 10, 26, 'g')
    .rect(2, 0, 10, 3, 'K')
    .rect(3, 3, 1, 22, 'G')
    .rect(3, 8, 3, 2, 'K')
    .rect(8, 8, 3, 2, 'K')
    .rect(6, 10, 2, 7, 'G')
    .rect(5, 17, 4, 1, 'K')
    .rect(4, 20, 6, 1, 'K')
    .rect(0, 26, 14, 2, 'M'),
);

export const moaiDef: SpriteDef = {
  name: 'moai',
  group: 'decoracion',
  width: MOAI[0]?.length ?? 0,
  height: MOAI.length,
  anchor: { x: 0.5, y: 1 },
  animations: {
    quieto: { fps: 1, frames: [MOAI] },
    /** Warm light in the eyes when the dog arrives: a greeting. */
    saludo: { fps: 2, frames: [MOAI, recolor(MOAI, { K: 'a' })] },
  },
};
