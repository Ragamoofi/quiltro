import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Decoración de Norte, Sur, Patagonia y La Antártica. Pivote en la base para
 * ordenarse por profundidad, igual que la del Centro.
 */
const deco = (name: string, frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

// ---- Norte ----
const CACTUS = outlined(
  new Pix(14, 26)
    .rect(5, 2, 4, 24, 'v')
    .rect(5, 2, 1, 24, 'V')
    .rect(8, 2, 1, 24, 'f')
    .rect(1, 8, 2, 8, 'v')
    .rect(1, 15, 5, 2, 'v')
    .rect(11, 5, 2, 9, 'v')
    .rect(8, 13, 5, 2, 'v')
    .rect(1, 8, 1, 8, 'V')
    .rect(12, 5, 1, 9, 'f')
    .set(6, 6, 'n')
    .set(7, 12, 'n')
    .set(6, 18, 'n')
    .set(2, 10, 'n')
    .set(11, 8, 'n')
    .rect(6, 0, 2, 2, 'p')
    .frame(),
);

const SALITRERA = outlined(
  new Pix(30, 22)
    .rect(0, 6, 30, 16, 'o')
    .rect(0, 6, 30, 1, 'n')
    .rect(0, 20, 30, 2, 'O')
    .rect(4, 10, 5, 8, 'd')
    .rect(13, 9, 4, 5, 'd')
    .rect(21, 10, 5, 8, 'd')
    .rect(24, 0, 4, 6, 'O')
    .rect(24, 0, 1, 6, 'o')
    .rows(0, 6, ['..o.....o.....o.....o.....o...', 'o.....o.....o.....o.....o.....'].map((r) => r.replace(/o/g, 'O')))
    .rows(0, 14, ['O...O...O...O...O...O...O...O.'])
    .frame(),
);

const FLOR = outlined(new Pix(6, 5).disc(1.5, 1.5, 1.3, 'p').disc(4.5, 1.5, 1.3, 'p').set(1, 1, 'y').set(4, 1, 'y').rect(2, 3, 1, 2, 'v').rect(3, 4, 2, 1, 'v').frame());

// ---- Sur ----
const ARAUCARIA = outlined(
  new Pix(26, 40)
    .rect(12, 12, 3, 28, 'd')
    .rect(12, 12, 1, 28, 'C')
    .ellipse(13, 6, 12, 4, 'F')
    .ellipse(13, 5, 10, 3, 'f')
    .ellipse(13, 14, 11, 3, 'F')
    .ellipse(13, 13, 9, 2, 'f')
    .ellipse(13, 22, 9, 3, 'F')
    .ellipse(13, 21, 7, 2, 'f')
    .rows(2, 4, ['v...v...v...v...v...v'])
    .rows(4, 12, ['v...v...v...v...v'])
    .frame(),
);

const IGLESIA = outlined(
  new Pix(30, 40)
    .rect(11, 0, 8, 6, 'r')
    .rect(13, 6, 4, 10, 'y')
    .rect(14, 8, 2, 3, 'k')
    .rect(2, 16, 26, 4, 'r')
    .rect(0, 19, 30, 2, 'R')
    .rect(2, 21, 26, 19, 'y')
    .rect(2, 21, 1, 19, 'w')
    .rect(12, 28, 6, 12, 'd')
    .rect(5, 25, 4, 6, 'b')
    .rect(21, 25, 4, 6, 'b')
    .rows(2, 23, ['AAAAAAAAAAAAAAAAAAAAAAAAAA'.split('').map((c, i) => (i % 2 ? '.' : c)).join('')])
    .rows(2, 33, ['A.A.A.A.A.....A.A.A.A.A.A.'])
    .frame(),
);

const COPIHUE = outlined(
  new Pix(8, 9)
    .rect(1, 0, 6, 1, 'v')
    .rect(3, 1, 2, 2, 'f')
    .rect(2, 3, 4, 4, 'r')
    .rect(2, 3, 1, 4, 'p')
    .rect(1, 7, 6, 1, 'r')
    .set(3, 8, 'W')
    .frame(),
);

// ---- Patagonia ----
const COIRON = outlined(
  new Pix(12, 8).rows(0, 0, ['.o...o...o..', '..o.o.o.o...', 'o..ooooo..o.', '.o.onnnno.o.', '..onnonnno..', '.onnonnonno.', 'onnnnnnnnnno', '.OOOOOOOOOO.']).frame(),
);

const CERCO = outlined(
  new Pix(30, 12)
    .rect(1, 0, 2, 12, 'd')
    .rect(14, 0, 2, 12, 'd')
    .rect(27, 0, 2, 12, 'd')
    .rect(0, 2, 30, 1, 'g')
    .rect(0, 5, 30, 1, 'g')
    .rect(0, 8, 30, 1, 'g')
    .rows(0, 2, ['.....G.........G.........G....'])
    .rows(0, 5, ['..G.........G.........G.......'])
    .frame(),
);

const HIELO = outlined(
  new Pix(16, 14)
    .rect(1, 2, 14, 12, 'i')
    .rect(3, 0, 10, 3, 'i')
    .rect(1, 9, 14, 5, 'I')
    .rect(2, 2, 2, 6, 'W')
    .rows(6, 4, ['s...', '.s..', '..ss'])
    .frame(),
);

// ---- La Antártica ----
const GRIETA = new Pix(20, 6).rows(0, 0, ['ssss................', '..ksssss............', '......kkksssss......', '.........kkk.kssss..', '...............kkss.', '..................ss']).frame();

export const decoNorte = [deco('cactus', CACTUS), deco('salitrera', SALITRERA), deco('flor', FLOR)];
export const decoSur = [deco('araucaria', ARAUCARIA), deco('iglesia', IGLESIA), deco('copihue', COPIHUE)];
export const decoPatagonia = [deco('coiron', COIRON), deco('cerco', CERCO), deco('hielo', HIELO)];
export const decoAntartica = [deco('grieta', GRIETA, 0.5)];

/** Which decorations each zone scatters (big, medium, small) — Centro has its own layout. */
export const DECO_ZONA: Readonly<Record<string, readonly string[]>> = {
  norte: ['salitrera', 'cactus', 'flor'],
  sur: ['iglesia', 'araucaria', 'copihue'],
  patagonia: ['cerco', 'hielo', 'coiron'],
  antartica: ['hielo', 'grieta', 'hielo'],
};
