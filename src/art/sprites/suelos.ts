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

/**
 * Los suelos son de tono medio-claro y poco ruido, para que el contorno tinta de
 * todo lo que se mueve se vea (`npm run contraste` lo mide por zona).
 *
 * Norte: arena clara del desierto con piedrecitas, grietas y una flor del desierto florido.
 */
export const sueloNorte = zoneFloor('suelo_norte', [
  toFrame(speckled('O', ['o', 'd'], 0.06, 1)),
  toFrame(stamp(speckled('O', ['o'], 0.05, 2), 2, 4, ['d......', '.dd....', '...d...', '....dd.', '......d'])),
  toFrame(stamp(speckled('O', ['o', 'd'], 0.05, 3), 6, 6, ['.n.', 'nwn'])),
  toFrame(stamp(speckled('O', ['o'], 0.05, 4), 5, 5, ['.p.', 'pyp', '.p.', '.v.', 'vv.'])),
]);

/** Sur: pasto húmedo con matas más oscuras, barro y briznas. */
export const sueloSur = zoneFloor('suelo_sur', [
  toFrame(speckled('v', ['f', 'f', 'V'], 0.2, 5)),
  toFrame(stamp(speckled('v', ['f', 'V'], 0.16, 6), 3, 5, ['.dddd.', 'ddMddd', 'dddddd', '.dddd.'])),
  toFrame(stamp(speckled('v', ['f', 'V'], 0.16, 7), 6, 4, ['f.f', 'f.f', '.f.'])),
  toFrame(stamp(speckled('v', ['f', 'V'], 0.16, 8), 4, 6, ['.r.', 'rrr', '.f.'])),
]);

/** Patagonia: nieve clara con sombras suaves y matas de coirón asomando. */
export const sueloPatagonia = zoneFloor('suelo_patagonia', [
  toFrame(speckled('w', ['G', 'i'], 0.07, 9)),
  toFrame(stamp(speckled('w', ['G'], 0.05, 10), 3, 6, ['o.o.o', '.ooo.', 'nonon'])),
  toFrame(stamp(speckled('w', ['i'], 0.06, 11), 1, 3, ['GGGG.......', '....GGGG...', '........GGG'])),
  toFrame(speckled('w', ['G', 'i', 'W'], 0.08, 12)),
]);

/** La Antártica: hielo claro con grietas azules. */
export const sueloAntartica = zoneFloor('suelo_antartica', [
  toFrame(speckled('i', ['s', 'W'], 0.06, 13)),
  toFrame(stamp(speckled('i', ['s'], 0.05, 14), 1, 2, ['s.......', '.s......', '..ss....', '....s...', '....s...', '.....ss.'])),
  toFrame(speckled('i', ['s', 'W'], 0.07, 15)),
  toFrame(stamp(speckled('i', ['s'], 0.05, 16), 4, 4, ['.ss.', 'siis', 'siis', '.ss.'])),
]);

/**
 * Fase 10.5: un suelo para cada lugar.
 *  - Santiago: el pastelón de la ciudad con calle: paso de cebra, línea amarilla, alcantarilla.
 *  - Costa de Valparaíso: piedras mojadas con espuma, conchitas, algas, pasto de borde y guijarros.
 *  - Lagos y Chiloé: pasto húmedo con matas claras, charcos, piedras y florcitas.
 */
const ciudadBase = (rows: readonly string[]): string[][] => rows.map((r) => [...r]);
const PASO_DE_CEBRA = ciudadBase(LISO);
for (const y of [2, 3, 6, 7, 10, 11]) for (let x = 0; x < 15; x++) PASO_DE_CEBRA[y]![x] = 'w';
const LINEA_AMARILLA = ciudadBase(LISO);
for (const y of [7, 8]) for (let x = 0; x < 15; x++) if (x % 8 < 4) LINEA_AMARILLA[y]![x] = 'y';
const ALCANTARILLA = stamp(ciudadBase(LISO), 5, 5, ['.MMMM.', 'MKKKKM', 'MKMMKM', 'MKMMKM', 'MKKKKM', '.MMMM.']);

export const sueloSantiago = zoneFloor('suelo_santiago', [
  LISO,
  toFrame(PASO_DE_CEBRA),
  toFrame(LINEA_AMARILLA),
  toFrame(ALCANTARILLA),
  ADOQUIN,
  TRIZADO,
]);

/** Valparaíso's steep streets: cobblestones laid in offset rows, with dark joints. */
function cobbles(seed: number): string[][] {
  const rows = speckled('g', ['G', 'G'], 0.06, seed);
  for (let y = 0; y < 16; y++) {
    const shift = Math.floor(y / 4) % 2 === 0 ? 0 : 4;
    for (let x = 0; x < 16; x++) {
      const row = rows[y];
      // Dotted joints (every other pixel): readable as stone without eating the contrast of what walks on it.
      if (row && ((y % 4 === 3 && x % 2 === 0) || ((x + shift) % 8 === 7 && y % 2 === 0))) row[x] = 'G';
    }
  }
  return rows;
}

export const sueloCosta = zoneFloor('suelo_costa', [
  toFrame(cobbles(21)),
  toFrame(stamp(cobbles(22), 5, 5, ['.p.', 'pWp'])),
  toFrame(stamp(cobbles(23), 4, 4, ['v.v', 'vVv', '.v.'])),
  toFrame(stamp(cobbles(24), 3, 5, ['gG.', 'Ggg'])),
]);

export const sueloLagos = zoneFloor('suelo_lagos', [
  toFrame(speckled('v', ['V', 'V', 'f'], 0.14, 31)),
  toFrame(stamp(speckled('v', ['V'], 0.1, 32), 3, 6, ['.ss.', 'sbbs', '.ss.'])),
  toFrame(stamp(speckled('v', ['V', 'f'], 0.1, 33), 5, 5, ['g.', 'Gg'])),
  toFrame(stamp(speckled('v', ['V'], 0.1, 34), 6, 5, ['.p.', 'pyp', '.v.'])),
]);

export const SUELO_PESOS: Readonly<Record<string, readonly number[]>> = {
  santiago: [22, 0.6, 0.9, 0.5, 2, 1],
  costa: [16, 3, 3, 2],
  lagos: [16, 3, 3, 2],
  norte: [16, 3, 3, 2],
  centro: SUELO_CENTRO_PESOS,
  sur: [16, 3, 4, 2],
  patagonia: [16, 3, 3, 3],
  antartica: [16, 3, 3, 2],
};

