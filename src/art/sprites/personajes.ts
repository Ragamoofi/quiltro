import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';
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

// ---- La Quiltra del Chalequito: quiltra clarita de oreja caída con chaleco tejido ----
const quiltra: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  // Curled tail.
  p.rect(2, 8 + y + (pose.wiggle ? 1 : 0), 2, 5, 'n').rect(2, 7 + y + (pose.wiggle ? 1 : 0), 2, 1, 'o');
  // Body, cream belly and the knitted vest (red with wine stripes and a gold button).
  p.ellipse(10, 15 + y, 6.5, lie ? 3 : 3.8, 'n').ellipse(11, 17 + y, 4.5, 1.4, 'w');
  p.rect(6, 12 + y, 8, 5, 'r');
  for (let x = 7; x < 14; x += 2) p.rect(x, 12 + y, 1, 5, 'R');
  p.rect(6, 12 + y, 8, 1, 'y').set(10, 15 + y, 'y');
  // Head with a lighter muzzle and one long floppy ear.
  p.disc(16, 10 + y, 3.8, 'n').rect(18, 11 + y, 3, 2, 'w').set(21, 11 + y, 'k');
  p.rect(13, 8 + y, 3, 6, 'o').set(13, 14 + y, 'o');
  p.rect(17, 5 + y, 2, 2, 'o');
  if (pose.eye === 'open') p.rect(18, 9 + y, 2, 2, 'k').set(18, 9 + y, 'W');
  else if (pose.eye === 'closed') p.rect(18, 10 + y, 2, 1, 'k');
  else p.set(18, 9 + y, 'k').set(19, 10 + y, 'k');
  if (pose.mouth) p.rect(19, 13 + y, 2, 2, 'R').set(20, 13 + y, 'r');
  legs(p, pose, [5, 8, 13, 16], 18 + y, 'n', 'o');
  return p;
};

// ---- El Gato del Almacén: gato gris atigrado con cascabel, calcetines blancos y una oreja rota ----
const gato: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 15 + y, 7, lie ? 3 : 4, 'g').ellipse(10, 17 + y, 5, 1.5, 'G');
  for (const sx of [6, 9, 12]) p.rect(sx, 12 + y, 1, 3, 'K');
  // Tail curling up behind, with stripes.
  const tx = pose.wiggle ? 1 : 2;
  p.rect(tx, 5 + y, 2, 10, 'g').rect(tx + 1, 4 + y, 2, 1, 'g').set(tx + 2, 3 + y, 'K').rect(tx + 2, 13 + y, 3, 2, 'g');
  for (const ty of [7, 10]) p.rect(tx, ty + y, 2, 1, 'K');
  p.disc(16.5, 9 + y, 4.5, 'g').ellipse(18, 11 + y, 3, 1.8, 'w');
  p.rows(13, 3 + y, ['g.....g', 'gg...gg']);
  // The torn ear: a notch bitten out of the left one.
  p.set(14, 3 + y, '.').set(13, 4 + y, '.');
  p.rect(16, 5 + y, 1, 2, 'K');
  if (pose.eye === 'open') p.set(18, 8 + y, 'V').set(19, 8 + y, 'k');
  else p.rect(18, 8 + y, 2, 1, 'K');
  if (pose.eye === 'hurt') p.set(18, 7 + y, 'k').set(19, 9 + y, 'k');
  p.set(21, 10 + y, 'p');
  if (pose.mouth) p.rect(19, 11 + y, 2, 2, 'R');
  p.set(21, 11 + y, 'W').set(20, 12 + y, 'W');
  // Collar with a golden bell.
  p.rect(14, 13 + y, 5, 1, 'r').rect(16, 14 + y, 2, 2, 'a').set(16, 14 + y, 'y');
  legs(p, pose, [5, 8, 13, 16], 18 + y, 'g', 'w');
  return p;
};

// ---- El Pudú: el ciervo más chico, con cuernos, orejas grandes y un copihue ----
const pudu: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 15 + y, 6, lie ? 2.5 : 3.5, 'C').ellipse(10, 14 + y, 4.5, 1.2, 'c');
  p.set(4, 13 + y, 'w').set(4, 14 + y, 'w').set(3, 13 + y, 'w');
  p.disc(15.5, 10 + y, 3.6, 'C').ellipse(16.8, 11.4 + y, 2.4, 1.6, 'c');
  // Big round ears with a pink inside.
  p.rect(12, 6 + y, 3, 4, 'C').set(13, 7 + y, 'p').set(13, 8 + y, 'p').rect(17, 6 + y, 3, 4, 'C').set(18, 7 + y, 'p');
  // Small forked antlers.
  p.rect(14, 2 + y, 1, 4, 'd').rect(18, 2 + y, 1, 4, 'd').set(13, 2 + y, 'd').set(19, 2 + y, 'd').set(15, 3 + y, 'd');
  // A copihue (the red bell flower of Chile) tucked behind the ear.
  p.rect(11, 9 + y, 2, 2, 'r').set(11, 9 + y, 'y').set(10, 10 + y, 'v');
  if (pose.eye === 'open') p.rect(16, 9 + y, 2, 2, 'k').set(16, 9 + y, 'W');
  else if (pose.eye === 'closed') p.rect(16, 10 + y, 2, 1, 'k');
  else p.set(16, 9 + y, 'k').set(17, 10 + y, 'k');
  p.set(19, 12 + y, 'k');
  if (pose.mouth) p.rect(18, 13 + y, 2, 1, 'R');
  legs(p, pose, [6, 8, 12, 14], 18 + y, 'd', 'k', true);
  return p;
};

// ---- El Pingüino de Humboldt: de pie, banda negra en el pecho y una bufanda a rayas ----
const pinguino: Draw = (pose) => {
  const p = new Pix(22, 22);
  const lie = pose.legs === 'lie';
  const sway = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
  const y = pose.dy + (pose.legs === 'tuck' ? 1 : 0);
  if (lie) {
    // Belly-down slide.
    p.ellipse(11, 17, 9, 3.5, 'K').ellipse(11, 19, 7, 1.5, 'w').disc(18, 15, 3, 'K').rect(20, 15, 2, 1, 'M');
    p.rect(14, 13, 5, 2, 'r').set(15, 13, 'w').set(17, 13, 'w');
    return p;
  }
  p.ellipse(11 + sway, 13 + y, 5.5, 7.5, 'K');
  p.ellipse(12.5 + sway, 14 + y, 3.5, 6, 'w');
  p.rect(10 + sway, 10 + y, 6, 1, 'k');
  p.disc(12 + sway, 5 + y, 4, 'K');
  p.rows(9 + sway, 2 + y, ['..www', '.w...', 'w....']);
  p.set(15 + sway, 6 + y, 'p').rect(16 + sway, 6 + y, 3, 1, 'o');
  if (pose.mouth) p.rect(16 + sway, 7 + y, 3, 1, 'o').set(17 + sway, 7 + y, 'R');
  if (pose.eye === 'open') p.set(14 + sway, 4 + y, 'W');
  else if (pose.eye === 'hurt') p.set(14 + sway, 4 + y, 'r');
  // The scarf: red with white stripes and a tail that flaps.
  p.rect(8 + sway, 9 + y, 8, 2, 'r').set(9 + sway, 9 + y, 'w').set(11 + sway, 9 + y, 'w').set(13 + sway, 9 + y, 'w').set(10 + sway, 10 + y, 'w').set(12 + sway, 10 + y, 'w');
  p.rect(6 + sway, 10 + y + (pose.wiggle ? 1 : 0), 3, 2, 'r');
  p.ellipse(6 + sway + (pose.wiggle ? -1 : 0), 14 + y, 1.8, 4.2, 'K');
  const fy = 20;
  p.rect(9 + (pose.legs === 'a' ? -1 : 0), fy, 3, 2, 'p').rect(13 + (pose.legs === 'b' ? 1 : 0), fy, 3, 2, 'p');
  return p;
};

// ---- La Paloma Rebelde: paloma grande, cuello tornasol, pañuelo rojo y lentes oscuros ----
const palomaRebelde: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  p.ellipse(10, 14 + y, 7, lie ? 3.5 : 5, 'G').ellipse(9, 13 + y, 5, 3, 'g');
  p.rows(4, 12 + y, ['K.K.K', '.....', 'K.K.K']);
  p.rect(1, 14 + y + (pose.wiggle ? 1 : 0), 4, 2, 'g');
  p.ellipse(15, 11 + y, 2.6, 2.6, 'T').set(14, 11 + y, 't').set(16, 12 + y, 't');
  p.disc(16, 7 + y, 3.4, 'G');
  // Red bandana tied round the head, its ends flying behind.
  p.rect(13, 4 + y, 7, 2, 'r').set(13, 4 + y, 'R').rect(10, 4 + y + (pose.wiggle ? 1 : 0), 3, 1, 'r').set(9, 5 + y + (pose.wiggle ? 1 : 0), 'r');
  // Dark sunglasses.
  if (pose.eye === 'hurt') p.set(17, 6 + y, 'r').set(16, 7 + y, 'r');
  else p.rect(15, 6 + y, 4, 2, 'k').set(16, 6 + y, 'W');
  p.rect(19, 8 + y, 2, 1, 'M').set(19, 7 + y, 'W');
  if (pose.mouth) p.set(19, 9 + y, 'M').set(20, 9 + y, 'R');
  if (!lie) {
    const sw = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
    const h = pose.legs === 'tuck' ? 1 : 3;
    p.rect(9 + sw, 19 - (3 - h) + y, 1, h, 'p').rect(12 - sw, 19 - (3 - h) + y, 1, h, 'p');
    p.rect(8 + sw, 21, 3, 1, 'p').rect(11 - sw, 21, 3, 1, 'p');
  }
  return p;
};

// ---- El Zorro Culpeo: esbelto, rojizo, cola tupida con punta negra y calcetines oscuros ----
const zorro: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  const tw = pose.wiggle ? 1 : 0;
  // Bushy tail with a dark tip.
  p.ellipse(4 + tw, 13 + y, 4, 5, 'O').ellipse(3 + tw, 14 + y, 2.4, 3.6, 'o').disc(2.5 + tw, 17.5 + y, 2, 'K');
  // Slim body, darker back, white chest and belly.
  p.ellipse(10, 15 + y, 6.5, lie ? 3 : 3.7, 'o').rect(6, 12 + y, 8, 1, 'O').ellipse(12, 17 + y, 4.5, 1.4, 'w');
  p.ellipse(14, 14 + y, 2.5, 2.5, 'w');
  // Long face, white cheek, dark nose and big pointed ears.
  p.disc(16, 10 + y, 3.3, 'o').rect(18, 10 + y, 3, 2, 'o').rect(17, 12 + y, 3, 1, 'w').set(21, 10 + y, 'k');
  p.rect(14, 5 + y, 2, 3, 'O').set(14, 4 + y, 'O').rect(17, 5 + y, 2, 3, 'O').set(18, 4 + y, 'O').set(15, 6 + y, 'k').set(18, 6 + y, 'k');
  if (pose.eye === 'open') p.set(17, 9 + y, 'a').set(18, 9 + y, 'k');
  else if (pose.eye === 'closed') p.rect(17, 9 + y, 2, 1, 'k');
  else p.set(17, 8 + y, 'k').set(18, 10 + y, 'k');
  if (pose.mouth) p.rect(19, 12 + y, 2, 2, 'R');
  legs(p, pose, [5, 8, 13, 16], 18 + y, 'K', 'k', true);
  return p;
};

// ---- El Chingue: negro con franja blanca, cola enorme y alzada ----
const chingue: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  const tw = pose.wiggle ? 1 : 0;
  // The huge tail with its white stripe, held high.
  p.ellipse(4 + tw, 9 + y, 3.6, 7, 'k').rect(3 + tw, 3 + y, 2, 9, 'w').ellipse(5 + tw, 11 + y, 2, 3, 'K');
  // Round body with two stripes along the back.
  p.ellipse(10, 15 + y, 6.5, lie ? 3 : 4, 'k').rect(6, 11 + y, 9, 1, 'w').rect(7, 12 + y, 7, 1, 'w').ellipse(10, 17 + y, 4, 1.4, 'K');
  // Small head with the white blaze, round ears and a pink nose.
  p.disc(16.5, 11 + y, 3.2, 'k').rect(16, 7 + y, 2, 5, 'w').set(14, 8 + y, 'k').set(19, 8 + y, 'k').set(20, 12 + y, 'p').rect(19, 12 + y, 2, 1, 'K');
  if (pose.eye === 'open') p.rect(18, 10 + y, 2, 2, 'W').set(19, 11 + y, 'k');
  else if (pose.eye === 'closed') p.rect(18, 11 + y, 2, 1, 'g');
  else p.set(18, 10 + y, 'r').set(19, 11 + y, 'r');
  if (pose.mouth) p.rect(19, 13 + y, 2, 2, 'R');
  legs(p, pose, [6, 9, 13, 16], 18 + y, 'K', 'k');
  return p;
};

// ---- El Cóndor: negro con collar blanco, cabeza pelada rosada y alas con manchas blancas ----
const condor: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  // Dark body, white wing patches and short tail feathers.
  p.ellipse(10, 14 + y, 6.5, lie ? 3.6 : 6, 'K').ellipse(9, 13 + y, 4.5, 4, 'k');
  p.rows(5, 11 + y, ['wwww', 'wwww', '.www']);
  p.rect(2, 17 + y + (pose.wiggle ? 1 : 0), 4, 3, 'k').rect(3, 19 + y + (pose.wiggle ? 1 : 0), 3, 1, 'K');
  // The white ruff, a long bare pink neck and head with a red comb.
  p.ellipse(14, 9 + y, 3.4, 2.2, 'w');
  p.rect(14, 5 + y, 2, 4, 'p').disc(15, 4 + y, 2.6, 'p').rect(14, 1 + y, 3, 1, 'r').set(15, 2 + y, 'r');
  // Hooked beak.
  p.rect(17, 4 + y, 3, 1, 'y').rect(19, 5 + y, 1, 2, 'a');
  if (pose.eye === 'open') p.set(16, 3 + y, 'k').set(16, 4 + y, 'W');
  else if (pose.eye === 'hurt') p.set(16, 3 + y, 'r').set(16, 4 + y, 'r');
  else p.rect(15, 3 + y, 2, 1, 'R');
  if (pose.mouth) p.set(18, 6 + y, 'R');
  if (!lie) {
    const s2 = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
    const h = pose.legs === 'tuck' ? 1 : 3;
    p.rect(9 + s2, 19 - (3 - h) + y, 2, h, 'G').rect(12 - s2, 19 - (3 - h) + y, 2, h, 'G');
    p.rect(8 + s2, 21, 4, 1, 'g').rect(11 - s2, 21, 4, 1, 'g');
  }
  return p;
};

// ---- El Guanaco: cuello largo, lana clara, cara oscura y orejas paradas ----
const guanaco: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  // Woolly body, pale belly and a little tail.
  p.ellipse(9, 14 + y, 6.5, lie ? 3 : 3.8, 'o').ellipse(10, 16 + y, 5, 1.4, 'n').rect(3, 11 + y + (pose.wiggle ? 1 : 0), 2, 2, 'o');
  p.rows(5, 10 + y, ['n.n.n.n', '.n.n.n.']);
  // The long neck rising to a small head with a dark face and tall ears.
  p.rect(13, 5 + y, 3, 8, 'o').rect(13, 5 + y, 1, 8, 'n');
  p.ellipse(17, 4 + y, 2.8, 2.2, 'o').rect(17, 3 + y, 4, 3, 'd').set(21, 4 + y, 'k');
  p.rect(15, 0 + y, 1, 3, 'O').rect(17, 0 + y, 1, 3, 'O');
  if (pose.eye === 'open') p.set(18, 3 + y, 'W').set(19, 3 + y, 'k');
  else if (pose.eye === 'hurt') p.set(18, 3 + y, 'r');
  else p.rect(18, 3 + y, 2, 1, 'k');
  if (pose.mouth) p.rect(19, 6 + y, 3, 1, 'R').set(20, 5 + y, 'W');
  legs(p, pose, [4, 7, 11, 14], 17 + y, 'n', 'd', true);
  return p;
};

export const personajesSprites: SpriteDef[] = [
  character('quiltra', quiltra),
  character('gato', gato),
  character('pudu', pudu),
  character('pinguino', pinguino),
  character('palomaRebelde', palomaRebelde),
  character('zorro', zorro),
  character('chinguePj', chingue),
  character('condor', condor),
  character('guanacoPj', guanaco),
];
