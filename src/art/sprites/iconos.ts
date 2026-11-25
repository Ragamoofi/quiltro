import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Íconos de cartas 16×16 (se muestran a ×2 en las cartas y a ×1 en el HUD).
 * Se dibujan en 14×14 y se les agrega el contorno de tinta.
 */
const P = (): Pix => new Pix(14, 14);
const icon = (p: Pix): Frame => outlined(p.frame());
const paw = (p: Pix, cx: number, cy: number, col: string): Pix =>
  p
    .ellipse(cx, cy + 1.5, 2.6, 2, col)
    .set(cx - 3, cy - 1, col)
    .set(cx - 1, cy - 2.5, col)
    .set(cx + 1, cy - 2.5, col)
    .set(cx + 2, cy - 1, col);

const ICONS: Record<string, Frame> = {
  // ---- Armas ----
  volantin: icon(
    P().rows(1, 1, [
      '......k.....',
      '.....krk....',
      '....krrwk...',
      '...krrrwwk..',
      '..krrrrwwwk.',
      '.krrrrrwwwwk',
      '..krrrrwwwk.',
      '...krrrwwk..',
      '....krrwk...',
      '.....krk....',
      '......k.....',
      '.......w.r..',
    ]),
  ),
  trompo: icon(
    P().rows(2, 1, [
      '....kk....',
      '...kddk...',
      '.kkkkkkkk.',
      'korooboork',
      'kooroobook',
      'korooboork',
      '.kooroook.',
      '..kroobk..',
      '...kook...',
      '....kGk...',
      '....kk....',
      '..........',
    ]),
  ),
  cables: icon(
    P()
      .rect(6, 0, 2, 14, 'g')
      .rect(6, 0, 1, 14, 'G')
      .rect(1, 2, 12, 1, 'd')
      .rows(0, 4, ['...yy.....', '..yWy.....', '.yy.......', 'yWyyyy....', '...yWy....', '..yy......', '.yy.......', 'y.........']),
  ),
  chaya: icon(
    P()
      .rows(0, 0, [
        '..p....y..t...',
        '.....b.......r',
        '.y.r....p.....',
        '......t...y...',
        '..b.........p.',
        '.....pppp.....',
        '...pp....p....',
        '..p..ttt..p...',
        '..p.t...t.p...',
        '...p.tt.t.p...',
        '....p..t.p....',
        '.y...pp.p...b.',
        '..........r...',
        '.t...y........',
      ]),
  ),
  fuegos: icon(
    P()
      .rect(6, 6, 2, 8, 'd')
      .rect(5, 2, 4, 6, 'r')
      .rect(5, 2, 1, 6, 'p')
      .rect(6, 0, 2, 2, 'w')
      .rows(0, 0, ['y............y', '..............', '.a..........a.', '..............', 'y............y'])
      .rect(5, 12, 4, 2, 'a'),
  ),
  rayuela: icon(
    P()
      .rect(0, 8, 6, 6, 'w')
      .rect(1, 9, 4, 4, 'm')
      .rect(7, 8, 6, 6, 'w')
      .rect(8, 9, 4, 4, 'm')
      .disc(7, 4, 3.5, 'G')
      .disc(7.6, 4.6, 2.2, 'g')
      .set(6, 2, 'W'),
  ),
  guau: icon(
    P()
      .ellipse(7, 6, 7, 6, 'w')
      .rows(2, 12, ['kww', '.kw'])
      .rect(6, 2, 2, 6, 'r')
      .rect(6, 9, 2, 2, 'r'),
  ),
  // ---- Rasgos ----
  pataDePerro: icon(
    P()
      .ellipse(7, 9.5, 4, 3.5, 'c')
      .ellipse(7, 10.5, 2.5, 2, 'l')
      .disc(2.5, 5.5, 1.8, 'c')
      .disc(5.5, 2.8, 1.8, 'c')
      .disc(9, 2.8, 1.8, 'c')
      .disc(12, 5.5, 1.8, 'c'),
  ),
  chalequito: icon(
    P().rows(0, 0, [
      '...rr....rr...',
      '..rRr....rRr..',
      '.rrRr....rRrr.',
      '.rRrrr..rrrRr.',
      'rrRrRrrrrRrRrr',
      'rRrrRrRrRrrrRr',
      'rrrRrrRrRRrRrr',
      'rRrrRrrRrrRrrr',
      'rrRrrRrrRrrRrr',
      'rRrRrrRrrRrrRr',
      'rrrrRrrRrrRrrr',
      'rRrRrrRrRrrRrr',
      'wwwwwwwwwwwwww',
      'wGwwGwwGwwGwwG',
    ]),
  ),
  laOnce: icon(
    P()
      .ellipse(9.5, 10, 4.5, 3, 'o')
      .ellipse(9.5, 9.2, 3.5, 1.6, 'A')
      .rect(9, 8, 1, 3, 'O')
      .rect(0, 3, 8, 7, 'w')
      .rect(0, 3, 8, 2, 'O')
      .rect(1, 4, 6, 1, 'o')
      .rect(8, 5, 2, 1, 'w')
      .rect(9, 5, 1, 3, 'w')
      .rect(6, 3, 2, 7, 'G'),
  ),
  cachai: icon(
    P()
      .ellipse(7, 7, 7, 4.5, 'w')
      .disc(7, 7, 3.2, 'b')
      .disc(7, 7, 1.6, 'k')
      .set(6, 5, 'W')
      .set(8, 8, 's'),
  ),
  choro: icon(
    P()
      .ellipse(7, 8, 6.5, 5.5, 'c')
      .ellipse(7, 10.5, 3.5, 2.5, 'l')
      .rows(0, 0, ['.CC........CC.', 'cCC........CCc'])
      .rows(2, 4, ['kk......kk', '.kk....kk.', '..k....k..'])
      .rect(4, 7, 2, 2, 'k')
      .rect(8, 7, 2, 2, 'k')
      .rect(6, 9, 2, 1, 'k'),
  ),
  // Three paw prints: "Llegaron los del barrio".
  laJauria: icon(paw(paw(paw(P(), 3.5, 3.5, 'c'), 10.5, 3.5, 'o'), 7, 9.5, 'C')),
  alTiro: icon(
    P().rows(2, 0, [
      '......yyyy',
      '.....yyyy.',
      '....yyyy..',
      '...yyyy...',
      '..yyyyyyy.',
      '.yyyyyyyy.',
      '......yy..',
      '.....yy...',
      '....yy....',
      '...yy.....',
      '..yW......',
      '.yy.......',
      '.y........',
      'y.........',
    ]),
  ),
  olfato: icon(
    P()
      .ellipse(7, 9, 6, 4.5, 'K')
      .ellipse(7, 8, 4, 2, 'g')
      .rect(3, 10, 2, 2, 'k')
      .rect(9, 10, 2, 2, 'k')
      .set(5, 7, 'G')
      .rows(2, 0, ['w..w..w...', '.w..w..w..', 'w..w..w...']),
  ),

  // ---- Fase 9.5: armas ----
  // Bolitas: three marbles.
  bolitas: icon(
    P()
      .disc(4.5, 4.5, 3.5, 'b')
      .disc(5.2, 5.2, 2.2, 'B')
      .set(3, 3, 'W')
      .disc(10, 5, 3, 'r')
      .disc(10.6, 5.6, 1.8, 'R')
      .set(9, 4, 'W')
      .disc(7, 10, 3.5, 'a')
      .disc(7.6, 10.6, 2.2, 'A')
      .set(6, 9, 'W'),
  ),
  // Emboque: the wooden handle with a cup, and the ball on its string.
  emboque: icon(
    P()
      .rect(2, 6, 3, 8, 'd')
      .rect(1, 4, 5, 3, 'C')
      .rect(2, 3, 3, 1, 'o')
      .rows(5, 2, ['.......', '..y....', '...y...', '....y..', '.....y.'])
      .disc(10.5, 3.5, 3, 'r')
      .disc(11, 4, 1.6, 'R')
      .set(9, 2, 'W'),
  ),
  // Elástico: a pink band stretched between two pegs.
  elastico: icon(
    P()
      .rect(1, 2, 2, 10, 'd')
      .rect(11, 2, 2, 10, 'd')
      .rect(3, 3, 8, 1, 'p')
      .rect(3, 4, 8, 1, 'r')
      .rect(3, 9, 8, 1, 'p')
      .rect(3, 10, 8, 1, 'r')
      .rect(3, 6, 8, 1, 'y'),
  ),
  // Ronda: a ring of colourful dots, the circle of the game.
  ronda: icon(
    P()
      .disc(7, 1.5, 1.5, 'y')
      .disc(11.5, 3.5, 1.5, 'p')
      .disc(12.5, 7.5, 1.5, 't')
      .disc(10.5, 11.5, 1.5, 'b')
      .disc(7, 12.5, 1.5, 'y')
      .disc(3.5, 11.5, 1.5, 'p')
      .disc(1.5, 7.5, 1.5, 't')
      .disc(2.5, 3.5, 1.5, 'b')
      .set(7, 7, 'a'),
  ),

  // Perfume (el aura del Chingue): a green cloud with wavy lines.
  perfume: icon(
    P()
      .ellipse(7, 9, 6, 3.6, 'v')
      .ellipse(4.5, 8, 2.8, 2.6, 'V')
      .ellipse(9.5, 7.5, 3, 2.8, 'v')
      .ellipse(7, 11, 5, 1.6, 'f')
      .rows(2, 0, ['.t..t.', 't..t..', '.t..t.', '..t...']),
  ),

  // ---- Fase 9.5: rasgos ----
  // Colmillo: a fang.
  colmillo: icon(
    P()
      .rect(1, 1, 12, 3, 'R')
      .rect(2, 3, 4, 2, 'r')
      .rows(2, 3, ['wwwwww', '.wwww.', '.wwww.', '..ww..', '..ww..', '...w..', '...w..'])
      .rows(8, 3, ['w', 'w', 'w'])
      .set(3, 4, 'W'),
  ),
  // Cola alegre: a wagging tail.
  colaAlegre: icon(
    P()
      .rect(1, 11, 4, 2, 'C')
      .rows(3, 4, ['...cc', '..ccC', '.ccC.', 'ccC..', 'cc...', 'cC...'])
      .rows(3, 9, ['cc.', 'cC.'])
      .rows(9, 2, ['.y', 'y.', '..'])
      .rows(11, 6, ['y.', '.y'])
      .set(10, 9, 'y'),
  ),
  // Siesta: a crescent moon and a Z.
  siesta: icon(
    P()
      .disc(6, 7, 5.5, 'y')
      .disc(8.5, 5.5, 5, '.')
      .rows(9, 1, ['wwww', '..w.', '.w..', 'wwww'])
      .set(3, 6, 'A')
      .set(4, 9, 'A'),
  ),
  // Hambre de lunes: a marraqueta with a bite.
  hambreDeLunes: icon(
    P()
      .ellipse(7, 8, 6.2, 4, 'o')
      .ellipse(7, 7, 5, 2.2, 'n')
      .rows(2, 6, ['O...O...O.', '.O...O...O'])
      .disc(11, 5, 2.2, '.')
      .rows(1, 11, ['..OOOOOO..'])
      .set(5, 5, 'W'),
  ),
  // Cascabel: a golden bell.
  cascabel: icon(
    P()
      .ellipse(7, 7, 5, 5, 'a')
      .rect(2, 9, 10, 3, 'a')
      .ellipse(5.5, 5.5, 2, 2.5, 'y')
      .rect(2, 11, 10, 1, 'A')
      .disc(7, 12.5, 1.5, 'k')
      .rect(6, 0, 2, 2, 'A')
      .set(4, 4, 'W'),
  ),
  // Manada chica: a little dog's face.
  manadaChica: icon(
    P()
      .ellipse(7, 8, 5.5, 4.8, 'c')
      .ellipse(7, 10, 3, 2, 'l')
      .rows(0, 0, ['CC........CC.', 'cCC......CCc.', '.cC......Cc..'])
      .rect(4, 7, 2, 2, 'k')
      .rect(8, 7, 2, 2, 'k')
      .rect(6, 9, 2, 2, 'k')
      .set(4, 7, 'W')
      .set(8, 7, 'W'),
  ),
};

export const ICON_IDS = Object.keys(ICONS);

export const iconos: SpriteDef = {
  name: 'icono',
  group: 'ui',
  width: 16,
  height: 16,
  anchor: { x: 0, y: 0 },
  animations: Object.fromEntries(Object.entries(ICONS).map(([id, f]) => [id, { fps: 1, frames: [f] }])),
};
