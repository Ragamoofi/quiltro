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

/**
 * The other zones' floors are generated from a base colour, sparse specks and a
 * hand-placed detail per variant. A tiny integer hash keeps them deterministic.
 */
function speckled(base: string, specks: readonly string[], density: number, seed: number): string[][] {
  const rows: string[][] = [];
  let s = seed * 2654435761;
  for (let y = 0; y < 16; y++) {
    const row: string[] = [];
    for (let x = 0; x < 16; x++) {
      s = (Math.imul(s ^ (s >>> 13), 0x5bd1e995) + x * 31 + y * 17) >>> 0;
      const r = (s % 1000) / 1000;
      row.push(r < density ? (specks[s % specks.length] ?? base) : base);
    }
    rows.push(row);
  }
  return rows;
}

function stamp(rows: string[][], x: number, y: number, art: readonly string[]): string[][] {
  art.forEach((line, j) => {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const row = rows[y + j];
      if (ch && ch !== '.' && row && x + i < 16) row[x + i] = ch;
    }
  });
  return rows;
}

const toFrame = (rows: string[][]): string[] => rows.map((r) => r.join(''));

const zoneFloor = (name: string, frames: string[][]): SpriteDef => ({
  name,
  group: 'suelos',
  width: 16,
  height: 16,
  anchor: { x: 0, y: 0 },
  animations: { variantes: { fps: 1, frames } },
});

/** Norte: tierra roja del desierto con piedrecitas, grietas y una flor del desierto florido. */
export const sueloNorte = zoneFloor('suelo_norte', [
  toFrame(speckled('d', ['O', 'K'], 0.05, 1)),
  toFrame(stamp(speckled('d', ['O'], 0.04, 2), 2, 4, ['K......', '.KK....', '...K...', '....KK.', '......K'])),
  toFrame(stamp(speckled('d', ['O', 'K'], 0.05, 3), 6, 6, ['.O.', 'OnO', '.O.'])),
  toFrame(stamp(speckled('d', ['O'], 0.04, 4), 5, 5, ['.p.', 'pyp', '.p.', '.v.', 'vv.'])),
]);

/** Sur: pasto húmedo con barro y briznas. */
export const sueloSur = zoneFloor('suelo_sur', [
  toFrame(speckled('f', ['F', 'v'], 0.12, 5)),
  toFrame(stamp(speckled('f', ['F'], 0.1, 6), 3, 5, ['.dddd.', 'ddMddd', 'dddddd', '.dddd.'])),
  toFrame(stamp(speckled('f', ['F', 'v'], 0.1, 7), 6, 4, ['v.v', 'v.v', '.v.'])),
  toFrame(stamp(speckled('f', ['F', 'v'], 0.1, 8), 4, 6, ['.r.', 'rrr', '.v.'])),
]);

/** Patagonia: nieve vieja con sombras y matas de coirón asomando. */
export const sueloPatagonia = zoneFloor('suelo_patagonia', [
  toFrame(speckled('G', ['g', 'i'], 0.05, 9)),
  toFrame(stamp(speckled('G', ['g'], 0.04, 10), 3, 6, ['o.o.o', '.ooo.', 'nonon'])),
  toFrame(stamp(speckled('G', ['i'], 0.05, 11), 1, 3, ['gggg.......', '....gggg...', '........ggg'])),
  toFrame(speckled('G', ['g', 'i', 'W'], 0.07, 12)),
]);

/** La Antártica: hielo azul con grietas claras. */
export const sueloAntartica = zoneFloor('suelo_antartica', [
  toFrame(speckled('I', ['i', 's'], 0.05, 13)),
  toFrame(stamp(speckled('I', ['s'], 0.04, 14), 1, 2, ['i.......', '.i......', '..ii....', '....i...', '....i...', '.....ii.'])),
  toFrame(speckled('I', ['i', 'W'], 0.06, 15)),
  toFrame(stamp(speckled('I', ['s'], 0.04, 16), 4, 4, ['.ss.', 'sIIs', 'sIIs', '.ss.'])),
]);

export const SUELO_PESOS: Readonly<Record<string, readonly number[]>> = {
  norte: [16, 3, 3, 2],
  centro: SUELO_CENTRO_PESOS,
  sur: [16, 3, 4, 2],
  patagonia: [16, 3, 3, 3],
  antartica: [16, 3, 3, 2],
};
