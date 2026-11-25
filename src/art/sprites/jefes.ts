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

// ---- Cai Cai Vilú: la serpiente del mar del mito de Chiloé (la que levantó las aguas) ----
const caiHead = (open: boolean): Frame => {
  const p = new Pix(38, 34);
  // Dorsal crest and side fin in blue.
  for (let i = 0; i < 5; i++) p.rect(6 + i * 4, 2 + (i % 2), 3, 8, 'b').rect(7 + i * 4, 2 + (i % 2), 1, 8, 's').rect(6 + i * 4, 9, 3, 1, 'B');
  // Head and snout: teal with a lighter top and a pale belly.
  p.ellipse(18, 19, 16, 12, 'T').ellipse(18, 16, 14, 8.5, 't').ellipse(30, 20, 8, 6, 't').ellipse(21, 26, 11, 3.5, 'n');
  p.rect(8, 22, 5, 7, 'b').rect(9, 22, 1, 7, 's');
  // Brow, golden eye with a slit pupil, nostril.
  p.rect(16, 10, 10, 2, 'T').ellipse(22, 15, 4.2, 4.2, 'y').rect(22, 12, 2, 7, 'k').set(21, 13, 'W').set(34, 17, 'k').set(33, 18, 'k');
  // The mouth: closed, or open with a red throat and teeth.
  if (open) {
    p.rect(22, 23, 15, 5, 'R').rect(22, 23, 15, 1, 'r');
    for (let x = 23; x < 37; x += 3) p.rect(x, 22, 2, 2, 'W').rect(x + 1, 27, 2, 2, 'W');
    p.rect(22, 28, 15, 3, 'T');
  } else {
    p.rect(22, 24, 15, 2, 'k').rect(22, 26, 15, 3, 'T');
    for (let x = 24; x < 36; x += 4) p.rect(x, 25, 1, 2, 'W');
  }
  // Whiskers (barbels) trailing from the chin.
  p.rows(26, 30, ['w....', '.ww..', '...ww', '.....w']);
  p.rows(3, 24, ['.....', 'ww...', '..ww.']);
  return outlined(p.frame());
};

const caiBody = (): Frame => {
  const p = new Pix(24, 24);
  p.rect(9, 0, 3, 6, 'b').rect(10, 0, 1, 6, 's').rect(13, 1, 3, 5, 'B');
  p.ellipse(12, 13, 11, 10, 'T').ellipse(11, 10, 9.5, 6.5, 't').ellipse(12, 19, 8, 3.5, 'n');
  // Scales: little arcs.
  for (const [x, y] of [
    [6, 9],
    [11, 7],
    [16, 9],
    [9, 12],
    [14, 12],
  ] as const)
    p.set(x, y, 'T').set(x + 1, y + 1, 'T').set(x - 1, y + 1, 'T');
  return outlined(p.frame());
};

const caiTail = (): Frame => {
  const p = new Pix(22, 22);
  p.ellipse(9, 12, 8, 7, 'T').ellipse(8, 10, 6.5, 4.5, 't').ellipse(9, 16, 5, 2.5, 'n');
  // The tail fin.
  p.rows(14, 4, ['..bb', '.bbb', 'bbbb', 'bbBb', 'bbbb', 'bbbb', '.bbb', '.bBb', '..bb']);
  p.rect(14, 8, 1, 4, 's');
  return outlined(p.frame());
};

const CAI_HEAD_C = caiHead(false);
const CAI_HEAD_O = caiHead(true);
const CAI_BODY = caiBody();
const CAI_TAIL = caiTail();

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
  boss('caiCai', { cabeza: { fps: 3, frames: [CAI_HEAD_C, CAI_HEAD_O] } }),
  boss('caiCaiCuerpo', { cuerpo: { fps: 1, frames: [CAI_BODY] } }),
  boss('caiCaiCola', { cola: { fps: 1, frames: [CAI_TAIL] } }),
];
