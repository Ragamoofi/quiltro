import { Pix } from '../draw.ts';
import { outlined, recolor, type Frame, type SpriteDef } from '../types.ts';
import { characterAnims, QUILTRO_FRAMES } from './quiltro.ts';

/*
 * Los otros 5 personajes jugables. Cada uno se dibuja con una función de pose
 * (patas, ojo, boca, altura) y de ahí salen todas las animaciones que usa el
 * jugador: quieto, parpadeo, trote, carga, ladrido, daño, muerte y silueta.
 */
export interface Pose {
  /** Leg phase: stand, stride A/B, tucked (crouch) or lying. */
  legs: 'stand' | 'a' | 'b' | 'tuck' | 'lie';
  eye: 'open' | 'closed' | 'hurt';
  mouth: boolean;
  /** Vertical offset of the whole body (bounce / crouch). */
  dy: number;
  /** Tail / idle wiggle phase. */
  wiggle: number;
}

type Draw = (p: Pose) => Pix;

const POSES: Record<keyof typeof QUILTRO_FRAMES, Pose> = {
  stand: { legs: 'stand', eye: 'open', mouth: false, dy: 0, wiggle: 0 },
  wag: { legs: 'stand', eye: 'open', mouth: false, dy: 0, wiggle: 1 },
  blink: { legs: 'stand', eye: 'closed', mouth: false, dy: 0, wiggle: 0 },
  strideA: { legs: 'a', eye: 'open', mouth: false, dy: 0, wiggle: 1 },
  strideB: { legs: 'b', eye: 'open', mouth: false, dy: 0, wiggle: 0 },
  passing: { legs: 'stand', eye: 'open', mouth: false, dy: -1, wiggle: 0 },
  crouchA: { legs: 'tuck', eye: 'open', mouth: false, dy: 1, wiggle: 1 },
  crouchB: { legs: 'tuck', eye: 'open', mouth: false, dy: 1, wiggle: 0 },
  barkA: { legs: 'stand', eye: 'open', mouth: true, dy: -1, wiggle: 0 },
  barkB: { legs: 'stand', eye: 'closed', mouth: true, dy: -1, wiggle: 1 },
  hurt: { legs: 'stand', eye: 'hurt', mouth: false, dy: 0, wiggle: 0 },
  deadA: { legs: 'lie', eye: 'hurt', mouth: false, dy: 3, wiggle: 0 },
  deadB: { legs: 'lie', eye: 'hurt', mouth: false, dy: 4, wiggle: 1 },
  sleepA: { legs: 'lie', eye: 'closed', mouth: false, dy: 3, wiggle: 0 },
  sleepB: { legs: 'lie', eye: 'closed', mouth: false, dy: 4, wiggle: 1 },
};

function character(name: string, draw: Draw): SpriteDef {
  const frames = Object.fromEntries(
    Object.entries(POSES).map(([k, pose]) => [k, outlined(draw(pose).frame())]),
  ) as Record<keyof typeof QUILTRO_FRAMES, Frame>;
  return { name, group: 'personajes', width: 24, height: 24, anchor: { x: 0.5, y: 22 / 24 }, flash: true, animations: characterAnims(frames) };
}

/** Four legs in side view (x positions of back and front pairs). */
function legs(p: Pix, pose: Pose, xs: readonly number[], top: number, color: string, paw: string, thin = false): void {
  if (pose.legs === 'lie') return;
  const h = pose.legs === 'tuck' ? 2 : 21 - top;
  xs.forEach((x, i) => {
    const swing = pose.legs === 'a' ? (i % 2 === 0 ? -1 : 1) : pose.legs === 'b' ? (i % 2 === 0 ? 1 : -1) : 0;
    const w = thin ? 1 : 2;
    p.rect(x + swing, top, w, h, color).rect(x + swing, top + h - 1, w, 1, paw);
  });
}

// ---- La Quiltra del Chalequito: quiltra clarita con chalequito tejido rojo ----
const VEST_ROWS = [13, 14, 15, 16, 17];
function quiltra(f: Frame): Frame {
  const light = recolor(f, { c: 'n', C: 'o', l: 'w', b: 'r', B: 'R' });
  return light.map((row, y) => {
    if (!VEST_ROWS.includes(y)) return row;
    return [...row].map((ch, x) => (x >= 4 && x <= 12 && 'nolw'.includes(ch) ? (x % 2 === 0 ? 'r' : 'R') : ch)).join('');
  });
}
const quiltraFrames = Object.fromEntries(Object.entries(QUILTRO_FRAMES).map(([k, f]) => [k, quiltra(f)])) as Record<
  keyof typeof QUILTRO_FRAMES,
  Frame
>;
export const quiltraDef: SpriteDef = {
  name: 'quiltra',
  group: 'personajes',
  width: 24,
  height: 24,
  anchor: { x: 0.5, y: 22 / 24 },
  flash: true,
  animations: characterAnims(quiltraFrames),
};

// ---- El Gato del Almacén: gato gris atigrado, cola arriba ----
const gato: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 15 + y, 7, lie ? 3 : 4, 'g').ellipse(10, 17 + y, 5, 1.5, 'G');
  for (const sx of [6, 9, 12]) p.rect(sx, 12 + y, 1, 3, 'K');
  // Tail curling up behind.
  const tx = pose.wiggle ? 1 : 2;
  p.rect(tx, 5 + y, 2, 10, 'g').rect(tx + 1, 4 + y, 2, 1, 'g').set(tx + 2, 3 + y, 'K').rect(tx + 2, 13 + y, 3, 2, 'g');
  p.disc(16.5, 9 + y, 4.5, 'g').ellipse(17.5, 11 + y, 3, 1.5, 'G');
  p.rows(13, 3 + y, ['g.....g', 'gg...gg']);
  p.rect(16, 5 + y, 1, 2, 'K');
  if (pose.eye === 'open') p.set(18, 8 + y, 'V').set(19, 8 + y, 'k');
  else p.rect(18, 8 + y, 2, 1, 'K');
  if (pose.eye === 'hurt') p.set(18, 7 + y, 'k').set(19, 9 + y, 'k');
  p.set(21, 10 + y, 'p');
  if (pose.mouth) p.rect(19, 11 + y, 2, 2, 'R');
  p.set(21, 11 + y, 'W').set(20, 12 + y, 'W');
  legs(p, pose, [5, 8, 13, 16], 18 + y, 'g', 'G');
  return p;
};

// ---- El Pudú: el ciervo más chico, cafecito con cuernitos ----
const pudu: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 15 + y, 6, lie ? 2.5 : 3.5, 'C').ellipse(10, 14 + y, 4.5, 1.2, 'c');
  p.set(4, 13 + y, 'w').set(4, 14 + y, 'w');
  p.disc(15.5, 10 + y, 3.5, 'C').ellipse(16.5, 11 + y, 2.2, 1.5, 'c');
  p.set(13, 7 + y, 'C').set(12, 6 + y, 'C').set(18, 7 + y, 'C').set(19, 6 + y, 'C');
  p.rect(14, 4 + y, 1, 3, 'd').rect(17, 4 + y, 1, 3, 'd').set(13, 4 + y, 'd').set(18, 4 + y, 'd');
  if (pose.eye === 'open') p.rect(16, 9 + y, 2, 2, 'k').set(16, 9 + y, 'W');
  else if (pose.eye === 'closed') p.rect(16, 10 + y, 2, 1, 'k');
  else p.set(16, 9 + y, 'k').set(17, 10 + y, 'k');
  p.set(19, 11 + y, 'k');
  if (pose.mouth) p.rect(18, 12 + y, 2, 1, 'R');
  legs(p, pose, [6, 8, 12, 14], 18 + y, 'd', 'k', true);
  return p;
};

// ---- El Pingüino de Humboldt: de pie, banda negra en el pecho ----
const pinguino: Draw = (pose) => {
  const p = new Pix(22, 22);
  const lie = pose.legs === 'lie';
  const sway = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
  const y = pose.dy + (pose.legs === 'tuck' ? 1 : 0);
  if (lie) {
    // Belly-down slide.
    p.ellipse(11, 17, 9, 3.5, 'K').ellipse(11, 19, 7, 1.5, 'w').disc(18, 15, 3, 'K').rect(20, 15, 2, 1, 'M');
    return p;
  }
  p.ellipse(11 + sway, 13 + y, 5.5, 7.5, 'K');
  p.ellipse(12.5 + sway, 14 + y, 3.5, 6, 'w');
  p.rect(10 + sway, 10 + y, 6, 1, 'k');
  p.disc(12 + sway, 5 + y, 4, 'K');
  p.rows(9 + sway, 2 + y, ['..www', '.w...', 'w....']);
  p.set(15 + sway, 6 + y, 'p').rect(16 + sway, 6 + y, 3, 1, 'M');
  if (pose.mouth) p.rect(16 + sway, 7 + y, 3, 1, 'M').set(17 + sway, 7 + y, 'R');
  if (pose.eye === 'open') p.set(14 + sway, 4 + y, 'W');
  else if (pose.eye === 'hurt') p.set(14 + sway, 4 + y, 'r');
  p.ellipse(7 + sway + (pose.wiggle ? -1 : 0), 13 + y, 1.6, 4, 'K');
  const fy = 20;
  p.rect(9 + (pose.legs === 'a' ? -1 : 0), fy, 3, 2, 'p').rect(13 + (pose.legs === 'b' ? 1 : 0), fy, 3, 2, 'p');
  return p;
};

// ---- La Paloma Rebelde: paloma grande caminando, cuello tornasol ----
const palomaRebelde: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 14 + y, 7, lie ? 3.5 : 5, 'G').ellipse(9, 13 + y, 5, 3, 'g');
  p.rows(4, 12 + y, ['K.K.K', '.....', 'K.K.K']);
  p.rect(1, 14 + y + (pose.wiggle ? 1 : 0), 4, 2, 'g');
  p.ellipse(15, 11 + y, 2.6, 2.6, 'T').set(14, 11 + y, 't').set(16, 12 + y, 't');
  p.disc(16, 7 + y, 3.4, 'G');
  if (pose.eye === 'open') p.set(17, 6 + y, 'A');
  else if (pose.eye === 'hurt') p.set(17, 6 + y, 'k').set(16, 5 + y, 'k');
  else p.set(17, 6 + y, 'g');
  p.rect(19, 7 + y, 2, 1, 'M').set(19, 6 + y, 'W');
  if (pose.mouth) p.set(19, 8 + y, 'M').set(20, 8 + y, 'R');
  if (!lie) {
    const s = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
    const h = pose.legs === 'tuck' ? 1 : 3;
    p.rect(9 + s, 19 - (3 - h) + y, 1, h, 'p').rect(12 - s, 19 - (3 - h) + y, 1, h, 'p');
    p.rect(8 + s, 21, 3, 1, 'p').rect(11 - s, 21, 3, 1, 'p');
  }
  return p;
};

export const personajesSprites: SpriteDef[] = [
  quiltraDef,
  character('gato', gato),
  character('pudu', pudu),
  character('pinguino', pinguino),
  character('palomaRebelde', palomaRebelde),
];
