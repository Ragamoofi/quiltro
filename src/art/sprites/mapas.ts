import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Fase 11.1b — mapas vivos. Decorado propio del Norte (desierto) y de Valparaíso / Viña, el
 * remolino de polvo nuevo, la llama del altiplano y el hito de Viña del Mar. Todo original y
 * genérico: casas de colores, cerros y plantas; sin marcas ni lugares con logo.
 */
const deco = (name: string, frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

// ---------------------------------------------------------------- Norte

/** Dust devil: a funnel of banded sand that sways, with a puff of dust at its foot and flying grit. */
const remolinoPolvo = (k: number): Frame => {
  const W = 30;
  const H = 46;
  const p = new Pix(W, H);
  const bands = ['n', 'o', 'n', 'O'] as const;
  for (let y = 3; y < H - 5; y++) {
    const t = (H - 6 - y) / (H - 9); // 0 at the foot, 1 at the top
    const r = 2.2 + 10.5 * t ** 1.15;
    const cx = W / 2 + Math.sin(y * 0.28 + k * 2.1) * (1 + 2.2 * t);
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const edge = Math.abs(x - cx) > r - 1.1;
      const band = Math.floor((y + k * 2 + (x - cx) * 0.35) / 3);
      p.set(x, y, edge ? 'd' : (bands[((band % 4) + 4) % 4] ?? 'o'));
    }
  }
  // The flared cap, darker where the dust is thickest.
  p.ellipse(W / 2 + 1, 4, 11, 3, 'O').ellipse(W / 2 + 1, 3, 9, 2, 'o');
  // The foot: a rolling cloud of dust.
  p.ellipse(W / 2, H - 6, 11, 4, 'o').ellipse(W / 2 - 2, H - 7, 7, 3, 'n').ellipse(W / 2 + 5, H - 5, 6, 2.5, 'O');
  // Grit and tumbleweed bits whirling around.
  for (let i = 0; i < 9; i++) {
    const a = k * 2.1 + i * 0.9;
    const y = 8 + ((i * 11 + k * 5) % 30);
    const tt = (H - 6 - y) / (H - 9);
    const r = 5 + 10.5 * tt;
    p.set(W / 2 + Math.cos(a) * r, y, i % 3 === 0 ? 'k' : 'd');
  }
  return outlined(p.frame());
};

export const remolinoPolvoDef: SpriteDef = {
  name: 'remolinoPolvo',
  group: 'efectos',
  width: 32,
  height: 48,
  anchor: { x: 0.5, y: 1 },
  animations: { girar: { fps: 10, frames: [remolinoPolvo(0), remolinoPolvo(1), remolinoPolvo(2), remolinoPolvo(3)] } },
};

const ESQUELETO = outlined(
  new Pix(28, 13)
    .rect(7, 8, 19, 1, 'w')
    .rect(7, 9, 19, 1, 'G')
    .rows(0, 0, ['.........w..w..w..w..w..w...', '........ww.ww.ww.ww.ww.ww...', '........w..w..w..w..w..w....'].map((r) => r.slice(0, 28)))
    .rect(8, 3, 1, 5, 'w')
    .rect(11, 3, 1, 5, 'w')
    .rect(14, 3, 1, 5, 'w')
    .rect(17, 3, 1, 5, 'w')
    .rect(20, 3, 1, 5, 'w')
    .rect(23, 4, 1, 4, 'w')
    // The skull, looking down at the sand.
    .ellipse(4, 8, 4, 3.4, 'w')
    .rect(0, 9, 3, 2, 'w')
    .rect(3, 7, 2, 2, 'k')
    .rect(24, 10, 4, 3, 'w')
    .rect(2, 11, 6, 2, 'G')
    .frame(),
);

const ROCAS = outlined(
  new Pix(26, 15)
    .rows(0, 0, [
      '......nnn.................',
      '....nnnooo.........nn.....',
      '..nnnooooOO.......nooO....',
      '.nnoooooooOd.....nooooOd..',
      '.noooooooOOdd...nooooOOOd.',
      'noooooOOOOOOd..noooOOOOOd.',
      'nooooOOOOOOOdd.oooOOOOOOdd',
      'ooooOOOOOOOddd.ooOOOOOOddd',
      'oOOOOOOOOddddOOOOOOOOdddd.',
      '.OOOOOOdddddOOOOOOOOddd...',
      '..dddddddddddddddddddd....',
    ])
    .frame(),
);
const ARBUSTO_SECO = ((): Frame => {
  const p = new Pix(18, 13);
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI * 0.95 + (i / 10) * Math.PI * 0.9;
    for (let s = 1; s < 8; s++) p.set(9 + Math.cos(a) * s * 1.05, 12 + Math.sin(a) * s * 1.35, s % 3 === 0 ? 'C' : 'd');
  }
  p.set(9, 12, 'd').set(8, 12, 'd').set(10, 12, 'd');
  return outlined(p.frame());
})();

/** Ground drawing made of pale stones (a geoglyph): a figure with raised arms, lying flat. */
const GEOGLIFO = ((): Frame => {
  const p = new Pix(34, 40);
  const dot = (x: number, y: number): void => {
    p.rect(x, y, 2, 2, 'n').set(x + 2, y + 1, 'O').set(x + 1, y + 2, 'O');
  };
  for (let y = 0; y < 8; y += 2) for (let x = 12; x < 22; x += 2) if ((x - 17) ** 2 + (y - 4) ** 2 < 22) dot(x, y); // head
  for (let y = 10; y < 28; y += 2) dot(16, y); // body
  for (let i = 0; i < 8; i++) {
    dot(16 - i * 2, 12 + (i < 4 ? 0 : (i - 3) * -2)); // left arm, raised at the end
    dot(18 + i * 2, 12 + (i < 4 ? 0 : (i - 3) * -2));
  }
  for (let i = 0; i < 6; i++) {
    dot(14 - i, 28 + i * 2); // legs
    dot(18 + i, 28 + i * 2);
  }
  return p.frame();
})();

const TORRE_MINA = outlined(
  new Pix(26, 46)
    // A-frame headframe of old timber with a wheel at the top and the cable going down.
    .rect(11, 4, 4, 3, 'd')
    .rect(10, 7, 6, 2, 'C')
    .rows(0, 9, ['..........dd..dd..........', '.........dd....dd.........', '.........d......d.........', '........dd......dd........', '........d........d........', '.......dd........dd.......', '.......d..........d.......', '......dd..........dd......', '......d............d......', '.....dd............dd.....', '.....d..............d.....', '....dd..............dd....', '....d................d....', '...dd................dd...', '...d..................d...', '..dd..................dd..', '..d....................d..', '.dd....................dd.', '.d......................d.', 'dd......................dd'])
    .rect(5, 22, 16, 1, 'C')
    .rect(3, 31, 20, 1, 'C')
    .rect(1, 40, 24, 1, 'C')
    .disc(13, 5, 3.4, 'G')
    .disc(13, 5, 1.4, 'k')
    .rect(12, 9, 1, 34, 'k')
    .rect(8, 41, 10, 5, 'O')
    .rect(8, 41, 10, 1, 'o')
    .frame(),
);

/** An "animita": the little roadside shrine with candles. */
const ANIMITA = outlined(
  new Pix(14, 17)
    .rect(2, 7, 10, 10, 'w')
    .rect(2, 15, 10, 2, 'G')
    .rows(0, 2, ['.....rr.....', '....rrrr....', '...rrrrrr...', '..rrrrrrrr..'].map((r) => `.${r}.`).map((r) => r.slice(0, 14)))
    .rect(4, 9, 6, 6, 'k')
    .rect(6, 11, 2, 4, 'y')
    .set(6, 10, 'a')
    .set(7, 10, 'a')
    .set(3, 16, 'y')
    .set(11, 16, 'y')
    .rect(6, 0, 2, 3, 'w')
    .rect(5, 1, 4, 1, 'w')
    .frame(),
);

const llamaFrame = (step: number): Frame => {
  const p = new Pix(22, 24);
  // Body, long neck, small head with banana ears, and a woolly tail.
  p.ellipse(11, 14, 8, 5, 'w').ellipse(11, 12, 7, 3, 'W').rect(15, 3, 3, 12, 'w').rect(15, 3, 1, 12, 'W');
  p.ellipse(17, 3, 3.2, 2.4, 'w').rect(18, 3, 4, 2, 'l').set(19, 2, 'k').rect(15, 0, 1, 3, 'w').rect(17, 0, 1, 2, 'w');
  p.set(2, 11, 'w').set(3, 10, 'w').set(2, 12, 'w');
  // Brown patches.
  p.rect(8, 11, 3, 2, 'C').rect(12, 15, 3, 2, 'C').set(6, 13, 'C');
  // Legs, in two alternating pairs.
  const a = step === 0 ? 0 : 1;
  p.rect(6 + a, 18, 1, 5, 'g').rect(9 - a, 18, 1, 5, 'g').rect(13 + a, 18, 1, 5, 'g').rect(16 - a, 18, 1, 5, 'g');
  return outlined(p.frame());
};

export const llamaDef: SpriteDef = {
  name: 'llama',
  group: 'decoracion',
  width: 24,
  height: 26,
  anchor: { x: 0.5, y: 1 },
  animations: { caminar: { fps: 4, frames: [llamaFrame(0), llamaFrame(1)] } },
};

// ---------------------------------------------------------------- Valparaíso y Viña

/** A house on the hill: colourful façade, a tin roof, little windows, a door and a washing line. */
const casaCerro = (wall: string, trim: string, roof: string, door: string, flag: string): Frame => {
  const p = new Pix(22, 30);
  p.rect(1, 10, 20, 20, wall).rect(1, 10, 20, 1, trim).rect(1, 28, 20, 2, trim);
  // Tin roof (calamina): a shallow slope with ridges.
  for (let y = 0; y < 5; y++) p.rect(5 - y, 4 + y, 12 + 2 * y, 1, roof);
  p.rect(0, 9, 22, 2, roof);
  for (let x = 3; x < 20; x += 3) p.rect(x, 5, 1, 5, 'k');
  p.rect(0, 9, 22, 1, 'G');
  // Windows with a pale frame, and a small balcony.
  for (const x of [3, 14]) p.rect(x, 14, 5, 5, 'w').rect(x + 1, 15, 3, 3, 'k').set(x + 1, 15, 's');
  p.rect(2, 20, 8, 1, 'k').rect(2, 19, 1, 1, 'k').rect(9, 19, 1, 1, 'k');
  p.rect(9, 22, 5, 8, door).rect(9, 22, 5, 1, 'k').set(12, 26, 'a');
  // A flag on the roof.
  p.rect(18, 0, 1, 5, 'k').rect(19, 0, 3, 2, flag);
  return outlined(p.frame());
};

const escalera = ((): Frame => {
  const p = new Pix(28, 20);
  // Concrete steps climbing the hill, with a railing on the open side.
  for (let i = 0; i < 8; i++) {
    const x = i * 3 + 1;
    const y = 18 - i * 2;
    p.rect(x, y, 4, 20 - y, 'G').rect(x, y, 4, 1, 'w').rect(x + 3, y + 1, 1, 20 - y, 'g');
  }
  for (let i = 0; i < 8; i += 2) p.rect(i * 3 + 2, 18 - i * 2 - 5, 1, 5, 'k');
  for (let i = 0; i < 22; i++) p.set(2 + i, 13 - Math.floor(i * 0.72), 'k');
  return outlined(p.frame());
})();
const ASCENSOR = ((): Frame => {
  const p = new Pix(30, 26);
  // Two rails climbing the hill and the little cabin car with windows.
  for (let i = 0; i < 28; i++) {
    const y = 22 - Math.floor(i * 0.6);
    p.set(1 + i, y, 'K').set(1 + i, y + 2, 'K');
    if (i % 5 === 0) p.rect(1 + i, y, 1, 4, 'd');
  }
  p.rect(10, 9, 13, 10, 'r').rect(10, 9, 13, 2, 'R').rect(10, 18, 13, 1, 'k');
  for (const x of [12, 17]) p.rect(x, 12, 4, 4, 's').rect(x, 12, 1, 4, 'w');
  p.rect(14, 5, 1, 4, 'k').rect(8, 4, 14, 1, 'k');
  return outlined(p.frame());
})();

const MURAL = ((): Frame => {
  const p = new Pix(32, 22);
  p.rect(0, 2, 32, 20, 'w').rect(0, 2, 32, 2, 'G').rect(0, 20, 32, 2, 'g');
  // Painted blobs, a sun, a fish, a face, a few drips.
  p.disc(8, 11, 4, 'y').disc(8, 11, 2, 'r').ellipse(20, 12, 6, 3.4, 't').rect(25, 10, 4, 4, 't').set(18, 11, 'k').rect(14, 6, 10, 2, 'b').rect(5, 16, 8, 2, 'p').rect(22, 16, 6, 2, 'r');
  for (const x of [6, 12, 19, 26]) p.rect(x, 17, 1, 3, x % 2 ? 'b' : 'p');
  p.rect(2, 5, 4, 1, 'k').rect(27, 6, 3, 1, 'k');
  return outlined(p.frame());
})();

const PALMERA = ((): Frame => {
  const p = new Pix(24, 38);
  // A slightly bent trunk with rings, topped by drooping fronds.
  for (let y = 0; y < 26; y++) {
    const x = 11 + Math.round(Math.sin(y * 0.18) * 1.5);
    p.rect(x, 37 - y, 3, 1, y % 4 === 0 ? 'd' : 'C');
  }
  const top = { x: 12, y: 11 };
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI;
    for (let s = 1; s < 11; s++) {
      const x = top.x + Math.cos(a) * s * 1.05;
      const y = top.y + Math.sin(a) * s * 0.7 + (s * s) * 0.03;
      p.set(x, y, s % 2 ? 'v' : 'f').set(x, y + 1, 'f');
    }
  }
  p.rect(11, 11, 3, 2, 'd');
  return outlined(p.frame());
})();

const GRUA = ((): Frame => {
  const p = new Pix(40, 52);
  // Quayside crane: lattice legs, a long jib and a hook.
  p.rect(10, 10, 3, 42, 'r').rect(24, 10, 3, 42, 'r').rect(10, 10, 1, 42, 'R').rect(24, 10, 1, 42, 'R');
  for (let y = 12; y < 50; y += 6) p.rect(13, y, 11, 1, 'R').set(14 + ((y / 6) % 5), y + 3, 'R');
  p.rect(2, 4, 36, 4, 'y').rect(2, 7, 36, 1, 'A').rect(14, 0, 10, 4, 'a');
  p.rect(33, 8, 1, 14, 'k').rect(31, 22, 5, 3, 'k').set(33, 25, 'k');
  p.rect(7, 8, 6, 8, 'K').rect(8, 10, 4, 3, 's');
  return outlined(p.frame());
})();

const BOTE = outlined(
  new Pix(30, 14)
    .ellipse(15, 8, 14, 5.5, 'b')
    .rect(0, 2, 30, 6, '.')
    .ellipse(15, 5, 13, 3, 'B')
    .rect(2, 3, 26, 1, 'w')
    .rect(0, 5, 30, 2, 'r')
    .rect(6, 8, 18, 4, 'b')
    .rect(6, 8, 18, 1, 's')
    .rect(13, 0, 1, 5, 'd')
    .frame(),
);

const SOMBRILLA = ((): Frame => {
  const p = new Pix(20, 24);
  p.ellipse(10, 7, 9, 6.5, 'r').rect(0, 7, 20, 7, '.');
  for (let x = 1; x < 19; x += 4) p.rect(x, 2, 2, 5, 'w');
  p.rect(0, 7, 20, 1, 'R').rect(10, 7, 1, 14, 'd').rect(5, 20, 10, 3, 'p').rect(5, 20, 10, 1, 't');
  return outlined(p.frame());
})();

const FAROL = outlined(
  new Pix(10, 30)
    .rect(4, 8, 2, 22, 'k')
    .rect(2, 26, 6, 4, 'K')
    .rect(2, 2, 6, 7, 'y')
    .rect(3, 3, 4, 5, 'W')
    .rect(1, 1, 8, 2, 'k')
    .rect(3, 9, 4, 1, 'k')
    .frame(),
);

const ANCLA = outlined(
  new Pix(14, 18)
    .rect(6, 2, 2, 13, 'G')
    .rect(4, 5, 6, 1, 'G')
    .disc(7, 2, 2, 'G')
    .disc(7, 2, 0.8, '.')
    .rect(1, 11, 3, 2, 'G')
    .rect(10, 11, 3, 2, 'G')
    .rect(2, 13, 10, 2, 'G')
    .rect(6, 15, 2, 2, 'G')
    .frame(),
);

/** Landmark of Viña del Mar: the flower clock on a green slope, with palm trees by the sea. */
const relojDeFlores = ((): Frame => {
  const p = new Pix(84, 32);
  // The slope and the sea beyond it.
  for (let x = 0; x < 84; x++) {
    const h = 9 + Math.round(8 * Math.sin((x / 84) * Math.PI));
    for (let d = 0; d < h; d++) p.set(x, 31 - d, d > h - 3 ? 'V' : 'v');
  }
  p.rect(0, 28, 84, 4, 'b').rect(0, 28, 84, 1, 's');
  p.rect(0, 25, 84, 3, 'v');
  // The clock: a ring of flowers around a pale face, with its hands.
  const cx = 42;
  const cy = 13;
  p.disc(cx, cy, 12, 'G').disc(cx, cy, 11, 'v');
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    p.set(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, ['r', 'y', 'p', 't'][i % 4] ?? 'r');
  }
  p.disc(cx, cy, 8, 'w');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    p.set(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 'k');
  }
  p.rect(cx, cy - 6, 1, 7, 'k').rect(cx, cy, 5, 1, 'r').set(cx, cy, 'k');
  p.rect(cx - 12, 21, 25, 3, 'g').rect(cx - 12, 21, 25, 1, 'G');
  // Palms either side.
  for (const x of [8, 20, 66, 77]) {
    p.rect(x, 17, 1, 9, 'd');
    for (const [dx, dy] of [[-3, 0], [-2, -2], [0, -3], [2, -2], [3, 0]] as const) p.rect(x + dx, 16 + dy, 2, 1, 'f');
  }
  return outlined(p.frame());
})();

/** A strip of beach: sand with a line of surf along one edge. */
const PLAYA = ((): Frame => {
  const p = new Pix(52, 22);
  p.ellipse(26, 13, 25, 8.5, 'l').ellipse(26, 14, 22, 6, 'n');
  for (let x = 2; x < 50; x++) {
    const y = 3 + Math.round(Math.sin(x * 0.5) * 1.2);
    p.set(x, y, 'b').set(x, y + 1, x % 2 ? 's' : 'W');
    if (x % 3 === 0) p.set(x, y + 2, 'W');
  }
  p.rect(6, 12, 2, 1, 'C').rect(30, 15, 2, 1, 'C').rect(40, 11, 1, 1, 'C').rect(14, 16, 1, 1, 'r');
  return outlined(p.frame());
})();

export const mapasSprites: SpriteDef[] = [
  deco('playa', PLAYA),
  remolinoPolvoDef,
  llamaDef,
  deco('esqueleto', ESQUELETO),
  deco('rocas', ROCAS),
  deco('arbusto_seco', ARBUSTO_SECO),
  deco('geoglifo', GEOGLIFO),
  deco('torre_mina', TORRE_MINA),
  deco('animita', ANIMITA),
  deco('casa_cerro1', casaCerro('y', 'A', 'G', 'b', 'r')),
  deco('casa_cerro2', casaCerro('p', 'R', 'g', 't', 'y')),
  deco('casa_cerro3', casaCerro('t', 'T', 'G', 'r', 'p')),
  deco('casa_cerro4', casaCerro('b', 'B', 'g', 'y', 'w')),
  deco('escalera', escalera),
  deco('ascensor', ASCENSOR),
  deco('mural', MURAL),
  deco('palmera', PALMERA),
  deco('grua', GRUA),
  deco('bote', BOTE),
  deco('sombrilla', SOMBRILLA),
  deco('farol', FAROL),
  deco('ancla', ANCLA),
  { ...deco('hito_vina', relojDeFlores), group: 'decoracion' },
];

/**
 * What each environment scatters on the ground: big, medium and small props (each a pool to pick from),
 * and the share of 96-px blocks that get one (`cuts` are cumulative: big, big+medium, all three).
 */
export interface DecoAmbiente {
  readonly big: readonly string[];
  readonly medium: readonly string[];
  readonly small: readonly string[];
  readonly cuts: readonly [number, number, number];
}

export const DECO_AMBIENTE: Readonly<Record<string, DecoAmbiente>> = {
  desierto: {
    big: ['salitrera', 'torre_mina', 'geoglifo'],
    medium: ['cactus', 'rocas', 'animita', 'esqueleto', 'cactus'],
    small: ['arbusto_seco', 'flor', 'arbusto_seco', 'rocas'],
    cuts: [0.06, 0.22, 0.46],
  },
  // Valparaíso and the coast: hills of colourful houses, stairs, lifts, murals, the port and the beach.
  costa: {
    big: ['casa_cerro1', 'casa_cerro2', 'casa_cerro3', 'casa_cerro4', 'grua', 'ascensor'],
    medium: ['palmera', 'escalera', 'mural', 'farol', 'casa_cerro2', 'casa_cerro1', 'casa_cerro3'],
    small: ['sombrilla', 'playa', 'ancla', 'bote', 'playa', 'farol'],
    cuts: [0.11, 0.28, 0.44],
  },
};