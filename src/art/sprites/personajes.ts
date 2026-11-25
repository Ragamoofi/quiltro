import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

export type Anims = Record<string, SpriteDef['animations'][string]>;
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

export type Draw = (p: Pose) => Pix;

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

/**
 * `own`: animations that replace the shared ones (Fase 11.9: the condor and the pigeon fly, the
 * pudú hops). Whatever it leaves out keeps the common poses (the condor stands to charge the cry,
 * to sleep in the menu and when it falls).
 */
export function character(name: string, draw: Draw, own?: (pose: (p: Partial<Pose>) => Frame) => Partial<Anims>): SpriteDef {
  const frames = Object.fromEntries(
    Object.entries(POSES).map(([k, pose]) => [k, outlined(draw(pose).frame())]),
  ) as Record<keyof typeof QUILTRO_FRAMES, Frame>;
  const posed = (p: Partial<Pose>): Frame => outlined(draw({ ...(POSES.stand as Pose), ...p }).frame());
  const animations = { ...characterAnims(frames), ...(own ? own(posed) : {}) } as Anims;
  return { name, group: 'personajes', width: 24, height: 24, anchor: { x: 0.5, y: 22 / 24 }, flash: true, animations };
}

/** A wing seen from the side as a band of pixels, with the given lift at the tips (+ up, − down). */
export function wing(p: Pix, cx: number, cy: number, span: number, lift: number, color: string, patch: string | null, tip: string): void {
  for (let x = cx - span; x <= cx + span; x++) {
    const d = Math.abs(x - cx);
    if (d < 2) continue;
    const y = Math.round(cy - Math.max(0, d - 2) * lift * 0.55);
    // Broad near the body, narrower toward the tips.
    const thick = d < 6 ? 3 : 2;
    p.rect(x, y, 1, thick, color);
    if (patch && d >= 4 && d <= 7) p.set(x, y + thick - 1, patch);
    // Spread "fingers" at the tips.
    if (d >= span - 2 && x % 2 === 0) p.set(x, y + (lift >= 0 ? -1 : 2), tip);
  }
}

/** The condor in flight: huge dark wings with white patches, the white ruff and the bare head. */
function condorFly(lift: number, mouth = false, hurt = false): Frame {
  const p = new Pix(22, 22);
  const cy = 7;
  wing(p, 11, cy - 1, 10, lift, 'K', 'w', 'k');
  p.ellipse(10, cy + 1, 5, 2.4, 'k').rect(3, cy, 3, 2, 'K');
  p.ellipse(14.5, cy, 2, 1.6, 'w');
  p.disc(17, cy - 1, 2, 'p').rect(16, cy - 3, 2, 1, 'r');
  p.rect(19, cy - 1, 2, 1, 'y').set(20, cy, 'a');
  if (hurt) p.set(17, cy - 2, 'r');
  else p.set(17, cy - 2, 'k');
  if (mouth) p.set(19, cy, 'R');
  // Feet tucked under the body.
  p.rect(9, cy + 3, 3, 1, 'G');
  return outlined(p.frame());
}

/** The rebel pigeon in flight: grey wings beating, the red bandana flying behind. */
function palomaFly(lift: number): Frame {
  const p = new Pix(22, 22);
  const cy = 9;
  wing(p, 10, cy - 1, 8, lift, 'g', null, 'G');
  p.ellipse(10, cy + 1, 5, 2.6, 'G').ellipse(9, cy + 1, 3.5, 1.5, 'g');
  p.rect(2, cy, 3, 2, 'g');
  p.ellipse(15, cy, 2, 2, 'T').set(14, cy, 't');
  p.disc(17, cy - 2, 2.6, 'G');
  p.rect(15, cy - 4, 5, 1, 'r').rect(12, cy - 4 + (lift > 0 ? 1 : 0), 3, 1, 'r');
  p.rect(16, cy - 3, 3, 1, 'k').set(17, cy - 3, 'W');
  p.rect(19, cy - 1, 2, 1, 'M');
  p.rect(9, cy + 3, 1, 1, 'p').rect(11, cy + 3, 1, 1, 'p');
  return outlined(p.frame());
}

/** Four legs in side view (x positions of back and front pairs). */
export function legs(p: Pix, pose: Pose, xs: readonly number[], top: number, color: string, paw: string, thin = false): void {
  if (pose.legs === 'lie') return;
  const h = pose.legs === 'tuck' ? 2 : 21 - top;
  xs.forEach((x, i) => {
    const swing = pose.legs === 'a' ? (i % 2 === 0 ? -1 : 1) : pose.legs === 'b' ? (i % 2 === 0 ? 1 : -1) : 0;
    const w = thin ? 1 : 2;
    p.rect(x + swing, top, w, h, color).rect(x + swing, top + h - 1, w, 1, paw);
  });
}

// ---- La Quiltra: una fox terrier chilena (Fase 11.13): blanca, cabeza negra con mejillas fuego,
// orejas dobladas, una mancha negra en el lomo, cola corta parada y collar rosado con moño ----
const quiltra: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(15, 8, 17, 'w', 'G', 'G', 1);
  stepLegs(p, pose, L.far);
  const lie = pose.legs === 'lie';
  const tw = pose.wiggle ? 1 : 0;
  // Short upright tail, white with a tan tip.
  p.rect(3 - tw, 6 + y, 2, 6, 'w').rect(3 - tw, 6 + y, 2, 1, 'o');
  // Slim white body with a little grey under the belly and the black saddle patch.
  p.ellipse(10, 14 + y, 6.5, lie ? 2.8 : 3.4, 'w').ellipse(10, 16.5 + y, 5, 1, 'G');
  p.ellipse(7, 12 + y, 2.6, 1.6, 'K');
  // Neck and the black head with tan cheeks and brows, a white blaze and muzzle.
  p.rect(13, 9 + y, 3, 4, 'w');
  p.disc(16.5, 8 + y, 3.4, 'K');
  p.rect(18, 8 + y, 4, 3, 'w').set(21, 8 + y, 'k');
  p.rect(17, 7 + y, 3, 2, 'o');
  p.set(18, 5 + y, 'w').set(18, 6 + y, 'w');
  p.set(16, 5 + y, 'o');
  // Folded ears (they tip forward).
  p.rows(13, 3 + y, ['KK..', 'KKK.', '.KK.']);
  p.rows(18, 3 + y, ['KK.', '.KK']);
  if (pose.eye === 'open') p.set(18, 7 + y, 'k').set(19, 7 + y, 'W');
  else if (pose.eye === 'closed') p.rect(17, 7 + y, 3, 1, 'K');
  else p.set(17, 7 + y, 'k').set(19, 8 + y, 'k');
  if (pose.mouth) p.rect(19, 10 + y, 3, 1, 'R').set(21, 10 + y, 'k');
  // Pink collar with a bow.
  p.rect(13, 11 + y, 3, 1, 'p').set(12, 11 + y, 'r').set(12, 12 + y, 'r');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Gato del Almacén: gato gris atigrado con cascabel, calcetines blancos y una oreja rota ----
const gato: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(16, 8, 18, 'g', 'K', 'w');
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Pudú (Fase 11.13): el ciervo más chico del mundo. Redondo y bajito, pelaje café rojizo,
// cabeza gacha, orejas grandes y redondas, cuernitos cortos, ojazos y patas cortas ----
const pudu: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(13, 5, 15, 'O', 'd', 'k', 1);
  stepLegs(p, pose, L.far);
  // Drawn by hand: a little hunched deer, rump higher than the shoulders, dark chocolate coat, the
  // head held low with a rusty face, big round ears with pale rims, two short spikes and rusty legs
  // (d chocolate · O rust · o pale rust · C belly · k black).
  p.rows(0, 2 + y, [
    '...........o.......o',
    '..........oOo.....oOo',
    '..........oOpo...oOpo',
    '...........oOOOOOOOo',
    '............dOOOOOOO',
    '...OOOOOO...dOOOOOOOd',
    '..ddddddddd.dOOOOOOddk',
    '.dddddddddddddOOOOdd',
    '.ddddddddddddddOOO',
    '.ddddddddddddddd',
    '.dddddddddddddd',
    '..dddddddddddd',
    '...CCCCCCCCC',
  ]);
  // Two short spike antlers between the ears.
  p.set(16, 3 + y, 'k').set(17, 3 + y, 'k');
  if (pose.wiggle) p.set(0, 8 + y, 'd');
  if (pose.eye === 'open') p.rect(16, 7 + y, 2, 2, 'k').set(16, 7 + y, 'W');
  else if (pose.eye === 'closed') p.rect(16, 8 + y, 2, 1, 'k');
  else p.set(16, 7 + y, 'k').set(17, 8 + y, 'k');
  if (pose.mouth) p.rect(19, 9 + y, 2, 1, 'R');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Pingüino de Humboldt (Fase 11.13): espalda y cabeza negras, la franja blanca que baja
// desde el ojo, la piel rosada en la base del pico, el pico negro y la banda negra en el pecho ----
const pinguino: Draw = (pose) => {
  const p = new Pix(22, 22);
  const lie = pose.legs === 'lie';
  const sway = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
  const y = pose.dy + (pose.legs === 'tuck' ? 1 : 0);
  if (lie) {
    // Belly-down slide.
    p.ellipse(11, 17, 9, 3.5, 'K').ellipse(11, 19, 7, 1.5, 'w').disc(18, 15, 3, 'K').rect(20, 15, 2, 1, 'k');
    p.set(17, 14, 'w').set(18, 15, 'p');
    return p;
  }
  const x = sway;
  // Black body and head, white belly.
  p.ellipse(11 + x, 13 + y, 5.5, 7.5, 'K');
  p.ellipse(12.5 + x, 14.5 + y, 3.6, 5.8, 'w');
  p.disc(12 + x, 5 + y, 4, 'K');
  // The white stripe: from above the eye, round the cheek and down the neck.
  p.rows(10 + x, 2 + y, ['..www.', '.w....', 'w.....', 'w.....', '.w....']);
  // The black breast band across the white belly, and a few black spots under it.
  p.rows(10 + x, 10 + y, ['.KKKKK', 'K....K']);
  p.set(13 + x, 14 + y, 'K').set(14 + x, 16 + y, 'K');
  // Pink skin at the base of the beak and the black beak.
  p.set(15 + x, 6 + y, 'p').rect(16 + x, 5 + y, 3, 2, 'k').set(18 + x, 5 + y, 'K');
  if (pose.mouth) p.rect(16 + x, 7 + y, 3, 1, 'k').set(17 + x, 7 + y, 'R');
  if (pose.eye === 'open') p.set(14 + x, 4 + y, 'W');
  else if (pose.eye === 'hurt') p.set(14 + x, 4 + y, 'r');
  // Flipper that swings with the walk.
  // The flipper: a slim dark paddle down the side, from the shoulder, swinging out a little.
  const out = pose.wiggle ? 1 : 0;
  for (let i = 0; i < 7; i++) {
    const fx = 9 + x - Math.floor((i * (1 + out)) / 3);
    p.rect(fx, 9 + y + i, i < 5 ? 2 : 1, 1, 'k');
    if (i < 4) p.set(fx + 1, 9 + y + i, 'K');
  }
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

// ---- El Zorro Culpeo (Fase 11.13): lomo gris canoso sobre pelaje rojizo, cabeza y patas color
// fuego, garganta blanca, orejas grandes de reverso negro, hocico largo, calcetines negros y una cola
// muy tupida, gris con la punta negra, separada del cuerpo por una sombra ----
const zorro: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(16, 9, 14, 'O', 'd', 'k', 1);
  stepLegs(p, pose, L.far);
  const tw = pose.wiggle ? 1 : 0;
  // Drawn by hand, pixel by pixel: a long horizontal body, the head held high, and a huge brush of a
  // tail straight out behind, grizzled grey with a black tip (o fire · O rust · m/n grizzled grey ·
  // w white · k black).
  // The fox's wedge of a head: wide at the big ears, tapering to a long pointed snout, white jaw.
  p.rows(0, 2 + y, [
    '.............O...O',
    '.............OO..OO',
    '.............OkOoOkO',
    '............oooooooo',
    '............ooooooooo',
    '............woooooooOk',
    '.............wwwwwO',
  ]);
  p.rows(0, 8 + y + tw, ['.nnmm', 'nmmmmmm', 'kmmmmmmm', 'kkmmmm', '.kk']);
  p.rows(0, 8 + y, [
    '..............',
    '.......nnnnnnnmoow',
    '........mmmmmmmooww',
    '......OOOOOOOOOooww',
    '......OOOOOOOOOoow',
    '......OwwwwwwwOOo',
  ]);
  if (pose.eye === 'open') p.set(16, 6 + y, 'a').set(17, 6 + y, 'k');
  else if (pose.eye === 'closed') p.rect(16, 6 + y, 2, 1, 'O');
  else p.set(16, 5 + y, 'k').set(17, 6 + y, 'k');
  if (pose.mouth) p.rect(17, 8 + y, 3, 1, 'R');
  // Long thin legs, rust above and black socks (the paws).
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Chingue (Fase 11.13): el zorrillo de Chile. Pelaje negro con dos franjas blancas que van
// de la frente a la cola, hocico largo de cerdito con nariz rosada, orejas chicas y una cola tupida
// que se arquea sobre el lomo ----
const chingue: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(14, 6, 16, 'K', 'k', 'k');
  stepLegs(p, pose, L.far);
  const tw = pose.wiggle ? 1 : 0;
  // Drawn by hand: long and low to the ground, one white stripe from the crown along the whole back
  // into the tall S of the tail (white on its front edge), a small head with a long snout and a
  // pink nose (K black fur · k ink · w white · p nose).
  p.rows(-tw, 1 + y, ['...KKK', '..KKgKK', '.KKwwKKK', '.KwwKKgK', '.KwKKKKK', '..wKKKK', '..wKKKK']);
  p.rows(0, 8 + y, [
    '...wKKKKKKK',
    '..KKwwwwwwwKKK',
    '.KKKKKKKKKwwwwKK.K',
    '.KKKKKKKKKKKKKwwKK',
    '.KKKKKKKKKKKKKKwKKKK',
    '.KKKKKKKKKKKKKKKKKKKp',
    '..KKKKKKKKKKKKKKKKK',
    '...KKKKKKKKKKKKKK',
  ]);
  if (pose.eye === 'open') p.set(18, 12 + y, 'W');
  else if (pose.eye === 'closed') p.set(18, 12 + y, 'g');
  else p.set(18, 12 + y, 'r');
  if (pose.mouth) p.rect(19, 14 + y, 2, 1, 'R');
  stepLegs(p, pose, L.near);
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
  const L = quad(14, 7, 17, 'n', 'O', 'd', 1);
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
  return p;
};

// ---------------------------------------------------------------------------------------------
// Fase 11.15 — legs that walk. The old `legs()` drew straight posts that slid one pixel back and
// forth; these bend at the knee, the swinging foot lifts off the ground, each leg ends in a paw,
// and the legs of the far side are drawn behind the body in a darker shade (draw those first).

export interface LegDef {
  /** Column of the hip (left edge of the leg) and the row where the leg leaves the body. */
  readonly x: number;
  readonly top: number;
  /** Width in px (2 by default). */
  readonly w?: number;
  readonly color: string;
  /** Darker colour for the far legs and the back edge of the near ones. */
  readonly shade: string;
  readonly paw: string;
  /** Legs of the same group move together (near back + far front, near front + far back). */
  readonly group: 0 | 1;
  /** A leg of the far side: drawn in the shade colour (draw it before the body). */
  readonly far?: boolean;
}

/** Ground row: every foot rests here. */
const GROUND = 21;

export function stepLegs(p: Pix, pose: Pose, defs: readonly LegDef[], stride = 2): void {
  if (pose.legs === 'lie') return;
  const dir = pose.legs === 'a' ? 1 : pose.legs === 'b' ? -1 : 0;
  for (const d of defs) {
    const w = d.w ?? 2;
    const c = d.far ? d.shade : d.color;
    const top = d.top + pose.dy;
    if (pose.legs === 'tuck') {
      // Folded under the body (crouching or in the air during a hop).
      const len = Math.min(3, Math.max(1, GROUND - top));
      for (let i = 0; i < len; i++) p.rect(d.x - (i === len - 1 ? 1 : 0), top + i, w, 1, c);
      p.rect(d.x - 1, top + len - 1, w + 1, 1, d.paw);
      continue;
    }
    const off = dir * (d.group === 0 ? 1 : -1) * stride;
    // The foot that swings forward is lifted one pixel off the ground.
    const bottom = GROUND - (off > 0 ? 1 : 0);
    if (bottom <= top) continue;
    const knee = top + Math.floor((bottom - top) * 0.45);
    let xx = d.x;
    for (let y = top; y <= bottom; y++) {
      const f = y <= knee ? 0 : (y - knee) / Math.max(1, bottom - knee);
      xx = d.x + Math.round(off * f);
      p.rect(xx, y, w, 1, c);
      if (!d.far && w > 1 && y > knee) p.set(xx, y, d.shade);
    }
    // The paw points forward.
    p.rect(xx, bottom, w + 1, 1, d.paw);
  }
}

/** Four legs: far pair first (behind the body), near pair after it. */
export const quad = (front: number, back: number, top: number, color: string, shade: string, paw: string, w = 2): { far: LegDef[]; near: LegDef[] } => ({
  far: [
    { x: front - 1, top, w, color, shade, paw: shade, group: 0, far: true },
    { x: back - 1, top, w, color, shade, paw: shade, group: 1, far: true },
  ],
  near: [
    { x: front, top, w, color, shade, paw, group: 1 },
    { x: back, top, w, color, shade, paw, group: 0 },
  ],
});

export const personajesSprites: SpriteDef[] = [
  character('quiltra', quiltra),
  character('gato', gato),
  // The pudú runs in little hops.
  character('pudu', pudu, (pose) => ({
    // In the air the legs fold under the body; they reach the ground only when it lands.
    trotar: { fps: 9, frames: [pose({ legs: 'a', dy: 0 }), pose({ legs: 'tuck', dy: -1 }), pose({ legs: 'tuck', dy: -2, wiggle: 1 }), pose({ legs: 'b', dy: 0 })] },
  })),
  character('pinguino', pinguino),
  // The pigeon walks when it stands still and flies when it moves.
  character('palomaRebelde', palomaRebelde, () => ({
    trotar: { fps: 12, frames: [palomaFly(2), palomaFly(0), palomaFly(-1.4), palomaFly(0)] },
  })),
  character('zorro', zorro),
  character('chinguePj', chingue),
  // The condor flies: it hovers with slow beats and beats hard when it moves. It lands (stands)
  // to charge its cry, to sleep in the menu and when it falls.
  character('condor', condor, () => ({
    quieto: { fps: 4, frames: [condorFly(0.6), condorFly(1.4), condorFly(0.6), condorFly(-0.6)] },
    parpadeo: { fps: 8, frames: [condorFly(0.6)], loop: false },
    trotar: { fps: 10, frames: [condorFly(2), condorFly(0.5), condorFly(-1.2), condorFly(0.5)] },
    ladrar: { fps: 10, frames: [condorFly(2.2, true), condorFly(2.2, true), condorFly(0.6)], loop: false },
    dano: { fps: 8, frames: [condorFly(-0.8, false, true)], loop: false },
  })),
  character('guanacoPj', guanaco),
];
