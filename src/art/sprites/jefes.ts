import { Pix } from '../draw.ts';
import { outlined, recolor, type Frame, type SpriteDef } from '../types.ts';

/* Los 4 jefes de la mitología, el tráfico y la tierra de Chile. */

const boss = (name: string, anims: Record<string, { fps: number; frames: Frame[] }>, anchorY = 0.5): SpriteDef => {
  const first = Object.values(anims)[0]?.frames[0] ?? [];
  return {
    name,
    group: 'enemigos',
    width: first[0]?.length ?? 0,
    height: first.length,
    anchor: { x: 0.5, y: anchorY },
    flash: true,
    animations: anims,
  };
};

// ---- El Alicanto: pájaro de alas metálicas que brilla (de frente, simétrico) ----
const alicanto = (wingsUp: boolean): Frame => {
  const p = new Pix(62, 46);
  // Wings: long metallic feathers fanning from each shoulder, gold and silver alternating.
  const shoulderY = 20;
  for (let i = 0; i < 6; i++) {
    const spread = wingsUp ? -0.95 + i * 0.3 : -0.35 + i * 0.3;
    const len = 26 - Math.abs(i - 2) * 2;
    const col = i % 2 === 0 ? 'G' : 'a';
    const shine = i % 2 === 0 ? 'W' : 'y';
    for (let t = 4; t < len; t++) {
      const dx = Math.cos(Math.PI + spread) * t;
      const dy = Math.sin(Math.PI + spread) * t * -1;
      const w = t > len - 4 ? 1 : 2;
      p.rect(Math.round(25 + dx), Math.round(shoulderY - dy), w, w, col);
      p.rect(Math.round(36 - dx), Math.round(shoulderY - dy), w, w, col);
      if (t % 5 === 0) {
        p.set(Math.round(25 + dx), Math.round(shoulderY - dy), shine);
        p.set(Math.round(37 - dx), Math.round(shoulderY - dy), shine);
      }
    }
  }
  // Tail of long golden plumes.
  for (const [dx, c] of [
    [-4, 'A'],
    [-2, 'a'],
    [0, 'y'],
    [2, 'a'],
    [4, 'A'],
  ] as const)
    p.rect(31 + dx, 34, 2, 11 - Math.abs(dx), c);
  // Body, neck and head.
  p.ellipse(31, 26, 7, 10, 'a').ellipse(31, 28, 4, 7, 'y').ellipse(33, 24, 2, 6, 'A');
  p.rect(29, 10, 5, 8, 'a').ellipse(31, 9, 5, 4.5, 'a');
  p.rows(28, 0, ['.y.y.y', 'y.yay.', '.yaa..']);
  p.rect(28, 8, 2, 2, 'r').rect(33, 8, 2, 2, 'r').set(28, 8, 'W').set(33, 8, 'W');
  p.rows(30, 11, ['AAA', '.A.']);
  p.rect(28, 36, 1, 3, 'O').rect(34, 36, 1, 3, 'O');
  p.set(29, 20, 'W').set(32, 30, 'W');
  return outlined(p.frame());
};

/** Phase 2: invisible but for the eyes. */
const OJOS = outlined(new Pix(10, 4).rect(0, 0, 3, 3, 'y').rect(7, 0, 3, 3, 'y').set(1, 1, 'W').set(8, 1, 'W').frame());

// ---- El Taco: autos (de lado) que forman la culebra ----
const auto = (body: string, shade: string, angry = false): Frame => {
  const p = new Pix(30, 14)
    .rect(0, 6, 30, 5, body)
    .rect(0, 10, 30, 1, shade)
    .rect(7, 1, 16, 6, body)
    .rect(9, 2, 5, 4, 's')
    .rect(15, 2, 6, 4, 's')
    .rect(10, 2, 1, 2, 'W')
    .rect(28, 7, 2, 2, angry ? 'y' : 'W')
    .rect(0, 7, 1, 2, 'r')
    .rect(3, 10, 6, 4, 'k')
    .rect(21, 10, 6, 4, 'k')
    .rect(5, 11, 2, 2, 'G')
    .rect(23, 11, 2, 2, 'G');
  if (angry) p.rows(24, 4, ['kk....', '.kk...']);
  return outlined(p.frame());
};

// ---- El Caleuche: barco fantasma ----
const caleuche = (lights: [string, string, string]): Frame => {
  const p = new Pix(94, 62);
  // Masts, sails (pale, torn), lanterns.
  for (const mx of [28, 48, 68]) {
    p.rect(mx, 4, 2, 38, 'd');
    p.rect(mx - 12, 8, 26, 12, 'G').rect(mx - 10, 22, 22, 12, 'G');
    p.rect(mx - 12, 8, 26, 1, 'W').rect(mx - 10, 22, 22, 1, 'W');
    p.rows(mx - 12, 19, ['G.G..G.GG.G..G.GG..G.G.G.G']);
    p.rows(mx - 10, 33, ['.G.G..GG.G..G.G.G..G.G']);
  }
  p.rect(48, 0, 8, 4, 'K');
  // Hull.
  p.rect(6, 40, 82, 12, 'K').rect(10, 52, 74, 4, 'K').rect(16, 56, 62, 3, 'K');
  p.rect(0, 38, 94, 3, 'g').rect(84, 32, 10, 8, 'K').rect(0, 34, 12, 6, 'K');
  for (let x = 12; x < 84; x += 9) p.rect(x, 44, 4, 3, lights[(x / 9) % 3 | 0] ?? 'y');
  p.rect(6, 49, 82, 1, 'g');
  // Ghostly fog at the waterline (dithered).
  for (let x = 0; x < 94; x++) for (let y = 57; y < 62; y++) if ((x + y) % 2 === 0) p.set(x, y, 'G');
  return outlined(p.frame());
};

// ---- El Tío René: el tío del barrio con megáfono (rediseño completo) ----
// Gorro azul, polera a rayas con chaleco, bermudas, calcetines altos con sandalias, el dedo en
// alto ("¡atención, atención!") y el megáfono. Un personaje inventado: no copia a nadie.
const tioRene = (pose: 'quieto' | 'quieto2' | 'grito' | 'grito2'): Frame => {
  const shout = pose === 'grito' || pose === 'grito2';
  const alt = pose === 'quieto2' || pose === 'grito2';
  const p = new Pix(72, 94);
  // Legs: calves, high white socks and dark sandals.
  p.rect(24, 66, 10, 10, 'l').rect(38, 66, 10, 10, 'l').rect(31, 66, 2, 10, 'c').rect(45, 66, 2, 10, 'c');
  p.rect(24, 76, 10, 10, 'w').rect(38, 76, 10, 10, 'w').rect(24, 76, 10, 1, 'g').rect(38, 76, 10, 1, 'g').rect(24, 80, 10, 1, 'G').rect(38, 80, 10, 1, 'G');
  p.rect(22, 86, 13, 5, 'd').rect(37, 86, 13, 5, 'd').rect(22, 90, 13, 2, 'k').rect(37, 90, 13, 2, 'k').rect(24, 86, 9, 1, 'C').rect(39, 86, 9, 1, 'C');
  // Bermudas with a belt.
  p.ellipse(36, 62, 18, 9, 'n').rect(18, 57, 36, 8, 'n').rect(35, 62, 2, 6, 'o').rect(18, 56, 36, 2, 'd').rect(34, 56, 4, 2, 'a');
  p.rect(18, 64, 36, 1, 'o');
  // Striped shirt over a round belly, and an open vest with pockets.
  p.ellipse(36, 42, 19, 19, 'y').ellipse(36, 50, 17, 12, 'y').ellipse(44, 48, 9, 13, 'A');
  for (const y of [35, 40, 45, 50]) p.rect(20, y, 32, 1, 'r');
  p.rect(16, 30, 10, 27, 'g').rect(46, 30, 10, 27, 'g').rect(16, 30, 2, 27, 'K').rect(54, 30, 2, 27, 'K').rect(19, 47, 6, 5, 'K').rect(47, 47, 6, 5, 'K').rect(19, 47, 6, 1, 'G').rect(47, 47, 6, 1, 'G');
  // Neck and collar.
  p.rect(30, 27, 12, 5, 'c').rect(28, 30, 16, 2, 'y');
  // Left arm raised with the index finger up (¡atención!).
  p.rect(8, 31, 9, 6, 'y').rect(9, 36, 8, 10, 'l').rect(5, 14, 8, 24, 'l').rect(11, 20, 2, 18, 'c');
  p.ellipse(9, 13, 4.5, 4.5, 'l').rect(alt ? 9 : 8, 3, 3, 11, 'l').rect(alt ? 9 : 8, 2, 3, 2, 'c');
  // Head: round, shaded, with big ears.
  p.ellipse(36, 19, 12.5, 12.5, 'l').ellipse(40, 23, 8, 9, 'c').ellipse(36, 19, 12, 12, 'l').ellipse(24, 20, 2.5, 3.5, 'l').ellipse(48, 20, 2.5, 3.5, 'l');
  p.ellipse(24, 20, 1.2, 2, 'p').ellipse(48, 20, 1.2, 2, 'p');
  // Blue cap with a brim pointing right.
  p.ellipse(36, 10, 13, 8, 'b').rect(23, 11, 26, 3, 'b').rect(38, 12, 18, 3, 'B').rect(30, 4, 8, 1, 's').rect(34, 7, 4, 3, 'w');
  p.rect(23, 14, 26, 1, 'B');
  // Eyes with eyebrows (angry when shouting), nose, big moustache, cheeks.
  p.rect(28, 17, 6, 6, 'W').rect(38, 17, 6, 6, 'W').rect(30, 18, 3, 4, 'k').rect(41, 18, 3, 4, 'k').set(30, 18, 'W').set(41, 18, 'W');
  if (shout) {
    for (let i = 0; i < 6; i++) p.set(27 + i, 14 + Math.floor(i / 2), 'k').set(44 - i, 14 + Math.floor(i / 2), 'k');
    p.set(27, 13, 'k').set(44, 13, 'k');
  } else {
    p.rect(27, 15, 7, 1, 'k').rect(38, 15, 7, 1, 'k');
  }
  p.rect(34, 21, 4, 5, 'c').rect(28, 24, 3, 2, 'p').rect(41, 24, 3, 2, 'p');
  p.rect(25, 26, 22, 3, 'd').rect(24, 27, 3, 3, 'd').rect(45, 27, 3, 3, 'd').rect(26, 26, 20, 1, 'C');
  if (shout) {
    p.rect(30, 29, 12, 7, 'R').rect(31, 29, 10, 2, 'W').rect(33, 34, 6, 2, 'r').rect(30, 29, 1, 7, 'k').rect(41, 29, 1, 7, 'k');
    p.set(23, 18, 's').set(23, 19, 's').set(23, 20, 's').set(50, 12, 's').set(50, 13, 's').set(21, 24, 's');
  } else {
    p.rect(32, 30, 8, 1, 'R').rect(33, 31, 6, 1, 'c');
  }
  // Right arm to the megaphone, and the megaphone itself (red and white stripes, silver rim).
  p.rect(55, 31, 9, 6, 'y').rect(54, 36, 8, 10, 'l').rect(49, 22, 7, 16, 'l').rect(51, 22, 2, 16, 'c');
  for (let i = 0; i < 25; i++) {
    const h = 5 + Math.floor(i * 0.6);
    p.rect(46 + i, 24 - Math.floor(h / 2), 1, h, Math.floor(i / 4) % 2 === 0 ? 'r' : 'w');
  }
  p.rect(69, 15, 2, 19, 'G').rect(70, 15, 1, 19, 'g').rect(52, 29, 4, 8, 'k').ellipse(52, 30, 4, 3.5, 'l');
  const out = new Pix(90, 94);
  out.rows(6, 0, p.frame());
  if (shout) {
    // Sound arcs from the megaphone's mouth.
    const col = pose === 'grito' ? 'a' : 'W';
    for (let r = 5; r <= 11; r += 3) {
      for (let a = -55; a <= 55; a += 7) {
        const rad = (a * Math.PI) / 180;
        out.set(77 + Math.cos(rad) * r, 24 + Math.sin(rad) * r * 1.3, col);
      }
    }
  }
  return outlined(out.frame());
};

const VECINO_A = tioRene('quieto');
const VECINO_B = tioRene('quieto2');
const VECINO_G1 = tioRene('grito');
const VECINO_G2 = tioRene('grito2');
/** Phase 2 ("en vivo y en directo"): red in the face, red cap, red shirt. */
const RABIA = { l: 'p', c: 'C', y: 'r', A: 'R', b: 'R', B: 'k', n: 'w' } as const;

const ALICANTO_A = alicanto(true);
const ALICANTO_B = alicanto(false);

export const jefesSprites: SpriteDef[] = [
  boss('alicanto', { volar: { fps: 6, frames: [ALICANTO_A, ALICANTO_B] } }),
  {
    name: 'alicanto_ojos',
    group: 'enemigos',
    width: 12,
    height: 6,
    anchor: { x: 0.5, y: 0.5 },
    animations: { brillar: { fps: 4, frames: [OJOS, recolor(OJOS, { y: 'a' })] } },
  },
  boss(
    'auto',
    {
      rojo: { fps: 1, frames: [auto('r', 'R')] },
      azul: { fps: 1, frames: [auto('b', 'B')] },
      turquesa: { fps: 1, frames: [auto('t', 'T')] },
      rosado: { fps: 1, frames: [auto('p', 'r')] },
      cabeza: { fps: 1, frames: [auto('r', 'R', true)] },
    },
    0.8,
  ),
  boss('caleuche', {
    navegar: { fps: 3, frames: [caleuche(['y', 'a', 'y']), caleuche(['a', 'y', 'a'])] },
    fiesta: { fps: 8, frames: [caleuche(['p', 't', 'y']), caleuche(['t', 'y', 'p']), caleuche(['y', 'p', 't'])] },
  }),
  boss(
    'vecinoViral',
    {
      quieto: { fps: 3, frames: [VECINO_A, VECINO_B] },
      grito: { fps: 8, frames: [VECINO_G1, VECINO_G2] },
      furia: { fps: 4, frames: [recolor(VECINO_A, RABIA), recolor(VECINO_B, RABIA)] },
      furiaGrito: { fps: 8, frames: [recolor(VECINO_G1, RABIA), recolor(VECINO_G2, RABIA)] },
    },
    0.85,
  ),
];
