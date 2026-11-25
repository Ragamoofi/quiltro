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

// ---- El Vecino Viral: un vecino con megáfono y celular, grabándolo todo ----
// Original: ningún personaje ni persona real. Gran pulmón, musculosa crema, short azul y sandalias.
const vecinoViral = (pose: 'quieto' | 'quieto2' | 'grito' | 'grito2'): Frame => {
  const shout = pose === 'grito' || pose === 'grito2';
  const p = new Pix(64, 84);
  // Legs, shorts and sandals.
  p.rect(20, 66, 10, 12, 'l').rect(34, 66, 10, 12, 'l').rect(28, 66, 2, 12, 'c').rect(34, 66, 2, 12, 'c');
  p.rect(18, 78, 13, 3, 'o').rect(33, 78, 13, 3, 'o').rect(18, 81, 13, 1, 'O').rect(33, 81, 13, 1, 'O');
  p.ellipse(32, 62, 15, 8, 'B').rect(17, 58, 30, 6, 'B').rect(31, 62, 2, 5, 'b');
  // Torso: cream tank top with turquoise stripes, a round belly.
  p.ellipse(32, 44, 17, 17, 'w').ellipse(37, 51, 12, 10, 'n');
  p.rect(16, 38, 32, 1, 't').rect(16, 43, 32, 1, 't').rect(18, 48, 28, 1, 't');
  p.rect(26, 29, 12, 4, 'l').rect(28, 31, 8, 3, 'c');
  // Left arm (the phone): shoulder, forearm up, hand.
  p.rect(10, 31, 6, 13, 'l').rect(6, 24, 6, 14, 'l').ellipse(8, 22, 3.5, 3.5, 'l');
  p.rect(1, 10, 11, 15, 'K').rect(2, 11, 9, 12, pose === 'quieto2' || pose === 'grito2' ? 's' : 'b');
  p.rect(3, 12, 6, 2, 'W').rect(9, 11, 2, 2, 'r').rect(3, 21, 7, 1, 'k');
  // Head: hair, face, big eyes, moustache and mouth.
  p.rect(28, 26, 8, 4, 'c');
  p.ellipse(32, 15, 10.5, 11.5, 'l').ellipse(21, 16, 2, 3, 'l').ellipse(43, 16, 2, 3, 'l');
  p.ellipse(32, 8, 12, 6.5, 'k').rect(25, 10, 14, 3, 'l').rect(21, 10, 3, 8, 'k').rect(41, 10, 3, 8, 'k');
  p.rows(23, 1, ['k.k..K.k.k', '.kkkkkkkk.']);
  p.rect(26, 13, 5, 5, 'W').rect(34, 13, 5, 5, 'W').rect(28, 14, 3, 4, 'k').rect(35, 14, 3, 4, 'k').set(28, 14, 'W').set(35, 14, 'W');
  p.rect(25, 11, 6, 1, 'k').rect(34, 11, 6, 1, 'k').set(30, 12, 'k').set(34, 12, 'k');
  p.rect(31, 17, 3, 3, 'c').rect(26, 18, 3, 2, 'p').rect(36, 18, 3, 2, 'p');
  p.rect(26, 21, 12, 2, 'k').rows(25, 22, ['k', 'k']).rows(38, 22, ['k', 'k']);
  if (shout) p.rect(27, 24, 10, 6, 'R').rect(28, 24, 8, 1, 'W').rect(30, 28, 5, 2, 'r');
  else p.rect(29, 25, 6, 1, 'R');
  // Right arm up to the megaphone, and the megaphone (red cone, silver rim).
  p.rect(48, 31, 6, 11, 'l').rect(43, 27, 8, 6, 'l');
  for (let i = 0; i < 22; i++) {
    const h = 4 + Math.floor(i * 0.5);
    p.rect(40 + i, 22 - Math.floor(h / 2), 1, h, i % 8 < 2 ? 'R' : 'r');
  }
  p.rect(61, 15, 2, 16, 'G').rect(46, 28, 3, 6, 'K').ellipse(46, 29, 3.5, 3, 'l');
  const out = new Pix(80, 84);
  out.rows(8, 0, p.frame());
  if (shout) {
    // Sound arcs from the megaphone's mouth.
    const col = pose === 'grito' ? 'a' : 'W';
    for (let r = 6; r <= 9; r += 3) {
      for (let a = -50; a <= 50; a += 8) {
        const rad = (a * Math.PI) / 180;
        out.set(70 + Math.cos(rad) * r, 22 + Math.sin(rad) * r * 1.3, col);
      }
    }
  }
  return outlined(out.frame());
};

const VECINO_A = vecinoViral('quieto');
const VECINO_B = vecinoViral('quieto2');
const VECINO_G1 = vecinoViral('grito');
const VECINO_G2 = vecinoViral('grito2');
/** Phase 2 ("se hizo viral"): flushed face, golden top, red stripes. */
const RABIA = { l: 'p', w: 'y', t: 'r', c: 'C', B: 'R', n: 'a' } as const;

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
