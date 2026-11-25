import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Hitos de las ciudades: siluetas anchas (≤ 34 px de alto) que cruzan el horizonte cuando
 * pasas por cada ciudad, y una casa de Valparaíso para el suelo. Todo original y genérico:
 * sitios naturales o casas de colores, sin marcas ni edificios con logos.
 */
const H = 32;

const hito = (name: string, frame: Frame): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: 1 },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

/** Fills columns from the bottom up to a height function, with a colour that may depend on depth. */
function profile(p: Pix, from: number, to: number, height: (x: number) => number, color: (x: number, depth: number) => string): void {
  for (let x = from; x < to; x++) {
    const h = Math.max(0, Math.round(height(x)));
    for (let d = 0; d < h; d++) p.set(x, p.h - 1 - d, color(x, d / Math.max(1, h)));
  }
}

const smooth = (t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

// ---- Arica: el Morro, un cerro que cae al mar, con un banderín arriba ----
const arica = (): Frame => {
  const p = new Pix(96, H);
  profile(
    p,
    10,
    96,
    (x) => 6 + 22 * smooth((x - 10) / 38) * (1 - smooth((x - 66) / 26)),
    (x, d) => (d > 0.82 ? 'n' : x < 42 ? 'o' : x < 62 ? 'O' : 'd'),
  );
  p.rect(0, H - 4, 96, 4, 'b').rect(0, H - 4, 96, 1, 's');
  for (let x = 0; x < 96; x += 6) p.set(x, H - 2, 'W');
  p.rect(50, 1, 1, 7, 'k').rect(51, 1, 5, 3, 'y');
  return outlined(p.frame());
};

// ---- Antofagasta: La Portada, un arco de roca en el mar ----
const antofagasta = (): Frame => {
  const p = new Pix(88, H);
  p.rect(16, 7, 50, 22, 'o').rect(16, 7, 50, 2, 'n').rect(46, 9, 20, 20, 'O');
  p.rect(20, 5, 12, 3, 'o').rect(44, 4, 10, 4, 'n');
  // The arch: a hole through the rock, sea and sky showing behind.
  p.ellipse(37, 23, 10, 9, '.').rect(27, 23, 20, 6, '.');
  p.rect(0, H - 6, 88, 6, 'b').rect(0, H - 6, 88, 1, 's');
  for (let x = 2; x < 88; x += 5) p.set(x, H - 4, 'W').set(x + 2, H - 2, 's');
  p.rect(12, H - 7, 6, 2, 'W').rect(62, H - 7, 6, 2, 'W');
  return outlined(p.frame());
};

// ---- Santiago (la Estación Central): una gran estación de fierro y vidrio, con trenes y la cordillera atrás ----
const santiago = (): Frame => {
  const p = new Pix(128, H);
  // The Andes far behind, softened.
  profile(
    p,
    0,
    128,
    (x) => 12 + 8 * Math.sin((x / 128) * Math.PI * 4 + 1) * 0.5 + 6 * Math.sin((x / 128) * Math.PI * 9),
    (_x, d) => (d > 0.78 ? 'w' : 'g'),
  );
  // The two side wings with rows of windows.
  for (const x0 of [4, 102]) {
    p.rect(x0, 14, 22, 18, 'n').rect(x0, 14, 22, 2, 'o');
    for (let wy = 18; wy < 28; wy += 4) for (let wx = x0 + 2; wx < x0 + 20; wx += 4) p.rect(wx, wy, 2, 2, 'K');
  }
  // The barrel-vaulted hall: an iron frame with glass between the ribs.
  for (let x = 24; x < 104; x++) {
    const top = 6 + Math.round((((x - 64) / 40) ** 2) * 9);
    p.rect(x, top, 1, H - top, 's');
    if ((x - 24) % 8 === 0) p.rect(x, top, 1, H - top, 'K');
    p.set(x, top, 'k');
  }
  p.rect(24, 24, 80, 1, 'K').rect(24, 30, 80, 2, 'K');
  // The clock tower over the hall.
  p.rect(60, 0, 8, 7, 'n').rect(59, 0, 10, 1, 'o').disc(64, 3.5, 2.4, 'W').set(64, 2, 'k').set(65, 3, 'k');
  // Two trains waiting under the roof: one red, one blue, with their windows.
  p.rect(28, 25, 34, 5, 'r').rect(28, 25, 34, 1, 'R');
  p.rect(66, 25, 34, 5, 'b').rect(66, 25, 34, 1, 'B');
  for (let wx = 30; wx < 60; wx += 5) p.rect(wx, 26, 3, 2, 'W');
  for (let wx = 68; wx < 98; wx += 5) p.rect(wx, 26, 3, 2, 'W');
  return outlined(p.frame());
};

// ---- Valparaíso: cerro con casas de colores, escaleras y un ascensor ----
const valparaiso = (): Frame => {
  const p = new Pix(120, H);
  const hill = (x: number): number => 10 + 18 * Math.min(1, (x / 120) ** 0.8);
  const colors = ['p', 'y', 't', 'b', 'r', 'a', 'l'];
  for (let bx = 0, n = 0; bx < 120; bx += 8, n++) {
    const top = H - Math.round(hill(bx));
    for (let row = 0, y = top; y < H - 3; row++, y += 6) {
      const c = colors[(n * 3 + row * 2) % colors.length] ?? 'p';
      p.rect(bx, y, 7, 6, c).rect(bx, y, 7, 1, row % 2 === 0 ? 'R' : 'K').set(bx + 2, y + 3, 'k').set(bx + 4, y + 3, 'k');
    }
  }
  // The funicular: a thin diagonal line up the hill.
  for (let x = 20; x < 100; x++) p.set(x, H - 5 - Math.round(((x - 20) / 80) * 20), 'k');
  p.rect(0, H - 3, 120, 3, 'b');
  for (let x = 1; x < 120; x += 6) p.set(x, H - 2, 's');
  return outlined(p.frame());
};

// ---- Temuco: araucarias y un volcán con humo ----
const temuco = (): Frame => {
  const p = new Pix(120, H);
  profile(
    p,
    50,
    120,
    (x) => 6 + Math.max(0, 22 - Math.abs(x - 86) * 0.62),
    (x, d) => (d > 0.8 ? 'w' : x < 86 ? 'g' : 'K'),
  );
  for (const [x, y] of [
    [88, 5],
    [91, 3],
    [86, 2],
  ] as const) p.set(x, y, 'G');
  // Araucarias: tall trunk and a flat umbrella of branches.
  for (const [x, h] of [
    [10, 20],
    [27, 24],
    [44, 18],
  ] as const) {
    p.rect(x, H - h, 2, h, 'd').ellipse(x + 1, H - h, 9, 3, 'F').rect(x - 7, H - h - 1, 16, 2, 'f');
  }
  p.rect(0, H - 2, 120, 2, 'F');
  return outlined(p.frame());
};

// ---- Puerto Montt: un volcán nevado sobre el mar, con un barco ----
const puertoMontt = (): Frame => {
  const p = new Pix(112, H);
  profile(
    p,
    34,
    112,
    (x) => 5 + Math.max(0, 25 - Math.abs(x - 74) * 0.7),
    (x, d) => (d > 0.58 ? 'w' : x < 74 ? 'g' : 'K'),
  );
  p.rect(0, H - 6, 112, 6, 'B').rect(0, H - 6, 112, 1, 'b');
  for (let x = 2; x < 112; x += 6) p.set(x, H - 3, 'b');
  // A small ship: hull and a sail.
  p.rect(8, H - 9, 20, 3, 'K').rect(6, H - 9, 2, 1, 'K').rect(16, H - 20, 1, 11, 'k').rows(17, H - 19, ['wwww', 'wwwww', 'wwwwww', 'wwwwwww', 'wwwwwww', 'wwwwwwww', 'wwwwwwww', 'wwwwwwww']);
  return outlined(p.frame());
};

// ---- Chiloé: palafitos de colores sobre el agua y una iglesia de madera ----
const chiloe = (): Frame => {
  const p = new Pix(120, H);
  p.rect(0, H - 8, 120, 8, 'B').rect(0, H - 8, 120, 1, 'b');
  for (let x = 2; x < 120; x += 7) p.set(x, H - 4, 'b').set(x + 3, H - 2, 'b');
  const house = (x: number, c: string, roof: string): void => {
    p.rect(x, H - 20, 12, 8, c).rect(x - 1, H - 22, 14, 2, roof).rect(x + 2, H - 18, 3, 3, 'k').rect(x + 7, H - 18, 3, 3, 'k');
    for (const sx of [x + 1, x + 5, x + 10]) p.rect(sx, H - 12, 1, 5, 'd');
  };
  house(6, 'y', 'R');
  house(24, 't', 'K');
  house(42, 'p', 'b');
  // The wooden church: two towers with shingled roofs.
  p.rect(72, H - 24, 36, 14, 'w').rect(72, H - 24, 36, 2, 'n');
  for (const x of [74, 98]) {
    p.rect(x, H - 31, 8, 8, 'w').rows(x + 1, H - 31, ['bbbbbb', '.bbbb.']);
    p.rect(x + 3, H - 32, 2, 2, 'b');
  }
  p.rect(86, H - 20, 8, 10, 'o').rect(88, H - 17, 4, 7, 'd');
  for (const sx of [74, 82, 94, 104]) p.rect(sx, H - 10, 1, 4, 'd');
  return outlined(p.frame());
};

// ---- Coyhaique: picos de roca y bosque ----
const coyhaique = (): Frame => {
  const p = new Pix(112, H);
  const peaks: readonly (readonly [number, number])[] = [
    [18, 24],
    [40, 30],
    [62, 22],
    [88, 27],
  ];
  profile(
    p,
    0,
    112,
    (x) => {
      let h = 6;
      for (const [c, top] of peaks) h = Math.max(h, top - Math.abs(x - c) * 1.15);
      return h;
    },
    (x, d) => (d > 0.78 ? 'w' : x % 9 < 4 ? 'g' : 'K'),
  );
  for (let x = 3; x < 112; x += 7) {
    const h = 5 + ((x * 3) % 4);
    p.rect(x, H - h - 1, 1, h, 'd').rows(x - 1, H - h - 5, ['.f.', 'fff', 'FFF']);
  }
  p.rect(0, H - 2, 112, 2, 'F');
  return outlined(p.frame());
};

// ---- Punta Arenas: el estrecho, un faro y un barco de carga ----
const puntaArenas = (): Frame => {
  const p = new Pix(104, H);
  profile(p, 0, 104, (x) => 9 + 3 * Math.sin(x / 9), (x, d) => (d > 0.7 ? 'W' : x % 17 < 8 ? 'g' : 'G'));
  p.rect(0, H - 12, 104, 12, 'B').rect(0, H - 12, 104, 1, 'b');
  for (let x = 1; x < 104; x += 5) p.set(x, H - 8, 'b').set(x + 2, H - 4, 's');
  // Lighthouse.
  for (let y = 0; y < 18; y++) p.rect(82, H - 30 + y, 6, 1, Math.floor(y / 3) % 2 === 0 ? 'w' : 'r');
  p.rect(81, H - 32, 8, 2, 'k').rect(83, H - 34 + 1, 4, 1, 'y');
  // Cargo ship with containers.
  p.rect(8, H - 16, 44, 5, 'R').rect(6, H - 16, 3, 2, 'R').rect(46, H - 22, 8, 6, 'w');
  for (const [x, c] of [
    [12, 'y'],
    [20, 't'],
    [28, 'p'],
    [36, 'b'],
  ] as const) p.rect(x, H - 21, 7, 5, c);
  return outlined(p.frame());
};

// ---- Casa de Valparaíso para el suelo: fachada de color con techo de lata ----
const casaValpo = (): Frame =>
  outlined(
    new Pix(18, 20)
      .rect(1, 6, 16, 14, 'y')
      .rect(0, 3, 18, 4, 'g')
      .rect(0, 3, 18, 1, 'G')
      .rect(3, 9, 4, 4, 'k')
      .rect(11, 9, 4, 4, 'k')
      .rect(4, 10, 2, 1, 's')
      .rect(12, 10, 2, 1, 's')
      .rect(7, 14, 4, 6, 'p')
      .rect(1, 15, 5, 5, 't')
      .frame(),
  );

export const ciudadesSprites: SpriteDef[] = [
  hito('hito_arica', arica()),
  hito('hito_antofagasta', antofagasta()),
  hito('hito_santiago', santiago()),
  hito('hito_valparaiso', valparaiso()),
  hito('hito_temuco', temuco()),
  hito('hito_puertoMontt', puertoMontt()),
  hito('hito_chiloe', chiloe()),
  hito('hito_coyhaique', coyhaique()),
  hito('hito_puntaArenas', puntaArenas()),
  hito('casa_valpo', casaValpo()),
];
