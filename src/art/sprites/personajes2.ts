import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';
import { character, legs, wing, type Draw, type Pose } from './personajes.ts';

/*
 * Fase 11.14 — sixteen new characters: eight animals of Chile, four from the rest of the
 * continent and four special ones from Chilean myth and folklore. Each is drawn by hand on a
 * 22×22 grid (the outline makes it 24×24) after looking at photos and pixel-art references of the
 * animal, and all of them use the same poses as the rest (idle, blink, trot, charge, cry, hurt,
 * death, sleep), so the game animates them the same way.
 */

const swing = (pose: Pose, i: number): number => (pose.legs === 'a' ? (i % 2 === 0 ? -1 : 1) : pose.legs === 'b' ? (i % 2 === 0 ? 1 : -1) : 0);

/** A bird in flight, seen from the side: body, wings at `lift` (+ up, − down) and the head. */
function birdFly(lift: number, look: { body: string; belly: string; wingC: string; patch: string | null; tip: string; head: (p: Pix, cy: number) => void; tail: string }): Frame {
  const p = new Pix(22, 22);
  const cy = 8;
  wing(p, 10, cy - 1, 9, lift, look.wingC, look.patch, look.tip);
  p.ellipse(10, cy + 1, 5, 2.4, look.body).ellipse(10, cy + 2, 3.5, 1, look.belly);
  p.rect(2, cy, 4, 2, look.tail);
  look.head(p, cy);
  return outlined(p.frame());
}

// ======================================= CHILE =======================================

// ---- El Puma: largo y bajo, pelaje leonado parejo, cabeza chica y redonda, hocico blanco con las
// marcas oscuras, cola larga y gruesa que cae con la punta negra ----
const puma: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  // A cat's head: round, small rounded ears, a broad white muzzle.
  p.rows(0, 4 + y, [
    '..............OO..OO',
    '..............oooooo',
    '.............oooooooo',
    '.............oooooowwk',
    '..............oooowww',
  ]);
  p.rows(0, 9 + y, [
    '...oooooooooooooww',
    '..ooooooooooooooww',
    '.ooOooooooooooow',
    '.oOOnnnnnnnnnoo',
    '..O..OOnnnnnOO',
  ]);
  // The heavy tail hangs and curls up at the black tip.
  p.rows(0, 10 + y, ['..o', '.oo', '.o', 'o', 'o', 'o' + (tw ? '' : ''), 'ok', '.k']);
  p.set(18, 9 + y, 'K');
  if (pose.eye === 'open') p.set(16, 6 + y, 'a').set(17, 6 + y, 'k');
  else if (pose.eye === 'closed') p.rect(16, 6 + y, 2, 1, 'O');
  else p.set(16, 5 + y, 'k').set(17, 6 + y, 'k');
  if (pose.mouth) p.rect(17, 9 + y, 3, 1, 'R');
  legs(p, pose, [4, 6, 12, 14], 14 + y, 'o', 'O');
  return p;
};

// ---- El Huemul: el ciervo del escudo. Robusto, pardo grisáceo, la máscara negra en "V" de la
// cara, hocico y garganta blancos, orejas grandes y astas cortas en horqueta ----
const huemul: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  // Sturdy brown-grey body with a pale belly and the short white tail.
  p.ellipse(9, 12 + y, 6.5, 3.6, 'C').ellipse(9, 14.6 + y, 5, 1, 'l').rect(2, 9 + y, 1, 3, 'w');
  p.ellipse(9, 9.6 + y, 5, 1, 'O');
  // Neck up to a deer's head: big ear, dark face with the black V mask, white chin.
  p.rect(13, 6 + y, 3, 6, 'C');
  p.disc(16, 5 + y, 2.8, 'C').rect(17, 4 + y, 4, 3, 'd').set(20, 4 + y, 'k').rect(17, 7 + y, 3, 1, 'w');
  p.ellipse(13, 3 + y, 1.8, 1, 'C').set(13, 3 + y, 'p');
  p.set(16, 3 + y, 'k').set(17, 4 + y, 'k');
  // Short forked antlers.
  p.rows(14, 0 + y, ['n.n', '.nn.n', '..nn']);
  if (pose.eye === 'open') p.set(15, 4 + y, 'k').set(15, 3 + y, 'W');
  else if (pose.eye === 'closed') p.rect(14, 4 + y, 2, 1, 'd');
  else p.set(14, 3 + y, 'k').set(15, 4 + y, 'k');
  if (pose.mouth) p.rect(18, 7 + y, 2, 1, 'R');
  legs(p, pose, [5, 7, 11, 13], 15 + y, 'd', 'k', true);
  return p;
};

// ---- El Monito del Monte: el marsupial chiquitito del bosque del sur. Gris pardo con la guata
// crema, ojazos negros con anillo oscuro, orejas redondas, manitos rosadas y una cola larga y
// gruesa enrollada ----
const monito: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  // The curled tail.
  p.rows(0, 8 + y, ['.mmm', 'm..mm', 'm...m', 'mm..m' + (tw ? 'm' : ''), '.mmmm', '...mm']);
  // Round body and big head.
  p.ellipse(9, 15 + y, 4.8, 3.6, 'm').ellipse(9.5, 16.5 + y, 3, 1.5, 'n');
  p.disc(14, 11 + y, 4, 'm');
  p.ellipse(15, 13 + y, 2.4, 1.6, 'n');
  // Round ears with pink inside.
  p.disc(12, 6.5 + y, 1.8, 'm').set(12, 7 + y, 'p');
  p.disc(15.5, 6.5 + y, 1.6, 'm').set(15, 7 + y, 'p');
  // The big dark eye with its dark ring, and the pink nose.
  if (pose.eye === 'open') p.rect(14, 9 + y, 3, 3, 'K').rect(15, 10 + y, 2, 2, 'k').set(15, 10 + y, 'W');
  else if (pose.eye === 'closed') p.rect(14, 10 + y, 3, 1, 'k');
  else p.set(14, 9 + y, 'k').set(16, 11 + y, 'k');
  p.set(18, 12 + y, 'p');
  if (pose.mouth) p.set(17, 14 + y, 'R');
  // Little pink hands held in front.
  p.set(13, 15 + y, 'p').set(15, 15 + y, 'p');
  legs(p, pose, [7, 11], 18 + y, 'm', 'p');
  return p;
};

// ---- El Flamenco chileno: rosado pálido con cubiertas rojas y plumas de vuelo negras, cuello largo
// en "S", pico doblado con punta negra y patas largas grises con rodillas rosadas ----
const flamenco: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  // Body with the red wing coverts and the black tips of the folded wing.
  p.ellipse(9, 10 + y, 5, 3, 'p').rect(6, 9 + y, 6, 2, 'r').rect(4, 10 + y, 2, 2, 'k');
  // S-shaped neck up to the head.
  p.rows(0, 1 + y, [
    '..............pp',
    '.............pWpp',
    '.............ppnnk',
    '..............p.nk',
    '.............p',
    '............p',
    '............pp',
    '.............p',
  ]);
  if (pose.eye === 'closed') p.set(14, 2 + y, 'p');
  else if (pose.eye === 'hurt') p.set(14, 2 + y, 'r');
  if (pose.mouth) p.set(17, 4 + y, 'R');
  if (!lie) {
    // Long legs with pink knees; tucked is one leg up, like a flamingo resting.
    const kneeY = 16 + y;
    const s0 = swing(pose, 0);
    const s1 = swing(pose, 1);
    p.rect(8 + s0, 13 + y, 1, 8 - y, 'G').set(8 + s0, kneeY, 'p').rect(7 + s0, 21, 2, 1, 'G');
    if (pose.legs === 'tuck') p.rect(10, 13 + y, 1, 3, 'G').rect(10, 15 + y, 2, 1, 'G');
    else p.rect(10 + s1, 13 + y, 1, 8 - y, 'G').set(10 + s1, kneeY, 'p').rect(10 + s1, 21, 2, 1, 'G');
  }
  return p;
};
const flamencoFly = (lift: number): Frame =>
  birdFly(lift, {
    body: 'p',
    belly: 'w',
    wingC: 'r',
    patch: 'p',
    tip: 'k',
    tail: 'p',
    head: (p, cy) => {
      // Neck stretched forward, legs trailing back.
      p.rect(14, cy, 4, 1, 'p').disc(18.5, cy, 1.4, 'p').rect(19, cy + 1, 2, 1, 'n').set(21, cy + 1, 'k').set(18, cy - 1, 'W');
      p.rect(0, cy + 2, 4, 1, 'G');
    },
  });

// ---- La Chinchilla: bolita gris de pelo suavísimo, orejas enormes y redondas, ojo grande, bigotes,
// y una cola tupida que se enrosca hacia arriba ----
const chinchilla: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  p.rows(tw, 7 + y, ['.gg', 'gGGg', 'gGGg', '.gGg', '..gg', '...g']);
  p.ellipse(9, 15 + y, 5.5, 4, 'G').ellipse(9, 17.5 + y, 4, 1.2, 'g').ellipse(10.5, 15.5 + y, 2.5, 2, 'w');
  p.disc(14.5, 11 + y, 3.8, 'G');
  // The big round ears with pink inside.
  p.ellipse(12, 5.5 + y, 2.2, 3, 'G').ellipse(12, 6 + y, 1, 2, 'p');
  p.ellipse(16, 6 + y, 1.8, 2.6, 'G').set(16, 6 + y, 'p');
  if (pose.eye === 'open') p.rect(15, 9 + y, 2, 2, 'k').set(15, 9 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 10 + y, 2, 1, 'k');
  else p.set(15, 9 + y, 'k').set(16, 10 + y, 'k');
  p.set(18, 12 + y, 'p');
  // Whiskers.
  p.set(19, 11 + y, 'w').set(20, 11 + y, 'w').set(19, 13 + y, 'w').set(20, 14 + y, 'w');
  if (pose.mouth) p.set(17, 13 + y, 'R');
  legs(p, pose, [6, 8, 12], 18 + y, 'G', 'p');
  return p;
};

// ---- El Lobo marino: el lobo marino común del Pacífico. Café dorado, cuello grueso con melena,
// hocico corto y romo con bigotes, cabeza en alto, aletas delanteras grandes y las traseras atrás ----
const loboMarino: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const lie = pose.legs === 'lie';
  const sw = pose.legs === 'a' ? -1 : pose.legs === 'b' ? 1 : 0;
  if (lie) {
    p.ellipse(10, 17, 9, 3.5, 'C').ellipse(10, 18.5, 7, 1.2, 'c').disc(18, 15, 3, 'C').rect(20, 15, 2, 2, 'O').set(21, 15, 'k');
    return p;
  }
  // The body tapers from the big chest down to the rear flippers on the floor.
  p.rows(0, 4 + y, [
    '..............CCCC',
    '.............CCCCCC',
    '............ACCCCCCOk',
    '............ACCCCCOOO',
    '...........AACCCCwwk',
    '..........AACCCCC',
    '.........AACCCCcc',
    '........OCCCCCccc',
    '.......OCCCCCcccc',
    '......OCCCCCcccc',
    '....OOCCCCCCccc',
    '..OOOCCCCCCccc',
    '.OOCCCCCCCccc',
  ]);
  // Whiskers and the small ear.
  p.set(20, 8 + y, 'w').set(21, 9 + y, 'w').set(14, 5 + y, 'O');
  if (pose.eye === 'open') p.set(16, 6 + y, 'k').set(16, 5 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 6 + y, 2, 1, 'O');
  else p.set(15, 5 + y, 'k').set(16, 6 + y, 'k');
  if (pose.mouth) p.rect(18, 9 + y, 2, 1, 'R');
  // Front flipper (it waddles) and the rear flippers.
  p.rows(11 + sw, 17, ['dd', 'ddd', 'dddd', '.ddd']);
  p.rows(0, 19, ['dd', 'ddd']);
  return p;
};

// ---- El Carpintero negro: el pájaro carpintero más grande de Sudamérica. Negro, con la cabeza y el
// copete rojos (el macho), manchas blancas en las alas, pico largo gris y la cola rígida de apoyo ----
const carpinteroHead = (p: Pix, cy: number): void => {
  p.disc(16, cy - 1, 2.4, 'r').rows(13, cy - 5, ['.rr', 'rrr.', '.rrr']).rect(18, cy - 1, 4, 1, 'G').set(17, cy - 2, 'a');
};
const carpintero: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  // Upright body clinging, stiff tail pointing down, white wing patch.
  p.ellipse(10, 12 + y, 3.8, 6, 'K').ellipse(11, 13 + y, 2, 4, 'k');
  p.rect(7, 10 + y, 2, 4, 'w').set(8, 14 + y, 'w');
  p.rows(6, 17 + y, ['KK', 'KK', '.K']);
  // Red head with the curled crest, long grey beak, pale eye.
  p.disc(13, 5 + y, 3, 'r').rows(9, 0 + y, ['..rr', '.rrrr', 'rrr..', '.r']);
  p.rect(16, 5 + y, 5, 1, 'G').set(21, 5 + y, 'g');
  if (pose.eye === 'open') p.set(14, 4 + y, 'a').set(14, 5 + y, 'k');
  else if (pose.eye === 'closed') p.rect(13, 4 + y, 2, 1, 'R');
  else p.set(14, 4 + y, 'k').set(13, 3 + y, 'k');
  if (pose.mouth) p.rect(16, 6 + y, 4, 1, 'G').set(17, 6 + y, 'R');
  if (pose.legs !== 'lie') p.rect(10 + swing(pose, 0), 18 + y, 1, 3 - y, 'M').rect(12 + swing(pose, 1), 18 + y, 1, 3 - y, 'M');
  return p;
};
const carpinteroFly = (lift: number): Frame => birdFly(lift, { body: 'K', belly: 'k', wingC: 'K', patch: 'w', tip: 'k', tail: 'K', head: carpinteroHead });

// ---- La Vizcacha: la de los cerros. Gris, como conejo de orejas largas, ojos grandes, una franja
// oscura en el lomo y una cola larga y tupida que se enrosca hacia arriba. Avanza a saltos ----
const vizcacha: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  p.rows(tw, 6 + y, ['.kg', 'kgg', 'gg', 'gg', 'gg.', '.ggg', '..gg']);
  p.ellipse(9, 14.5 + y, 5.5, 4, 'g').ellipse(9.5, 17 + y, 4, 1.2, 'G').rect(5, 11 + y, 7, 1, 'K');
  p.disc(14.5, 10 + y, 3.4, 'g').ellipse(15.5, 11.5 + y, 2, 1.4, 'G');
  // Long upright ears.
  p.rect(12, 1 + y, 2, 6, 'g').set(12, 2 + y, 'p').set(12, 3 + y, 'p').rect(14, 2 + y, 2, 5, 'g');
  if (pose.eye === 'open') p.rect(15, 8 + y, 2, 2, 'k').set(15, 8 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 9 + y, 2, 1, 'k');
  else p.set(15, 8 + y, 'k').set(16, 9 + y, 'k');
  p.set(18, 11 + y, 'k').set(19, 10 + y, 'w').set(19, 12 + y, 'w');
  if (pose.mouth) p.set(17, 12 + y, 'R');
  // Big hind foot and small front paws.
  if (pose.legs !== 'lie') {
    const h = pose.legs === 'tuck' ? 1 : 3;
    p.rect(6, 18 + y, 4, Math.max(1, h - y), 'g').rect(5, 21, 5, 1, 'K');
    p.rect(13, 18 + y, 1, Math.max(1, h - y), 'g');
  }
  return p;
};

// ==================================== DEL CONTINENTE ====================================

// ---- La Capibara (carpincho): barril café, cabeza grande y cuadrada de frente plana, orejitas,
// ojo arriba, sin cola, patas cortas. Lleva una mandarina en la cabeza, muy tranquila ----
const capibara: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  p.rows(0, 4 + y, [
    '...............aa',
    '..............aAaa',
    '.............CC.CCCC',
    '............CCCCCCCC',
    '............CCCCCCCCC',
    '...CCCCCCCCCCCCCCCOO',
    '..CCCCCCCCCCCCCCCOOOk',
    '.CCCCCCCCCCCCCCCCOOO',
    '.CCCCCCCCCCCCCCCcO',
    '.OCCCCCCCCCCCCccc',
    '..OOccccccccccc',
  ]);
  p.set(13, 6 + y, 'O');
  if (pose.eye === 'open') p.set(16, 7 + y, 'k');
  else if (pose.eye === 'closed') p.rect(15, 7 + y, 2, 1, 'O');
  else p.set(16, 6 + y, 'k').set(15, 7 + y, 'k');
  if (pose.mouth) p.rect(18, 12 + y, 2, 1, 'R');
  legs(p, pose, [3, 5, 12, 14], 15 + y, 'O', 'd');
  return p;
};

// ---- La Llama: blanca de lana con manchas café, cuello largo, orejas de plátano con borlas de
// colores (como en el altiplano) y patas largas ----
const llama: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  p.rows(0, 0 + y, [
    '..............r.r',
    '..............w.w',
    '..............wwww',
    '.............wwwwnk',
    '..............wwwn',
    '..............www',
    '..............www',
    '.............wwww',
    '...www.....wwwwww',
    '..wwwwwwwwwwwwwww',
    '.wwCCwwwwwwwwwwww',
    '.wwCCCwwwwwwCCwww',
    '..wwwwwwwwwwwwww',
    '...nwnwnwnwnwnw',
  ]);
  // Coloured tassels on the ears.
  p.set(14, 0 + y, 'p').set(16, 0 + y, 'r').set(14, 1 + y, 't');
  if (pose.eye === 'open') p.set(16, 3 + y, 'k').set(16, 2 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 3 + y, 2, 1, 'n');
  else p.set(15, 2 + y, 'k').set(16, 3 + y, 'k');
  if (pose.mouth) p.rect(17, 5 + y, 2, 1, 'R');
  legs(p, pose, [4, 6, 12, 14], 14 + y, 'w', 'n', true);
  return p;
};

// ---- El Tucán: negro con el pecho amarillo, el pico enorme anaranjado con punta negra y el anillo
// azul alrededor del ojo ----
const tucanHead = (p: Pix, cy: number): void => {
  p.disc(15, cy - 1, 2.6, 'K').rect(14, cy, 3, 2, 'y').rect(17, cy - 2, 4, 2, 'a').rect(17, cy, 3, 1, 'o').set(21, cy - 2, 'k').set(15, cy - 2, 'b');
};
const tucan: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  p.ellipse(10, 12 + y, 4, 5.5, 'K').ellipse(12, 11 + y, 2, 3, 'y').ellipse(11.5, 14 + y, 1.5, 1, 'r');
  p.rows(5, 17 + y, ['KK', 'KK', 'K']);
  // The big beak: orange on top, red-orange below, black tip; blue eye ring.
  p.disc(12, 5 + y, 3, 'K').rect(11, 6 + y, 3, 2, 'y');
  p.rows(14, 3 + y, ['aaaaaa.', 'aaaaaaak', 'ooooo', 'ooo']);
  if (pose.eye === 'open') p.set(12, 4 + y, 'b').set(13, 4 + y, 'k');
  else if (pose.eye === 'closed') p.rect(12, 4 + y, 2, 1, 'b');
  else p.set(12, 4 + y, 'r').set(13, 4 + y, 'r');
  if (pose.mouth) p.rect(14, 5 + y, 4, 1, 'R');
  if (pose.legs !== 'lie') p.rect(9 + swing(pose, 0), 18 + y, 1, 3 - y, 'b').rect(11 + swing(pose, 1), 18 + y, 1, 3 - y, 'b');
  return p;
};
const tucanFly = (lift: number): Frame => birdFly(lift, { body: 'K', belly: 'y', wingC: 'K', patch: null, tip: 'k', tail: 'K', head: tucanHead });

// ---- El Jaguar: más robusto que el puma, dorado con rosetas negras, cabeza ancha y redonda, cola
// con anillos ----
const jaguar: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  p.rows(0, 4 + y, [
    '..............a...a',
    '.............aaaaaaa',
    '.............aaaaaaa',
    '.............aaaaaaaa',
    '.............aaaaawwk',
  ]);
  p.rows(0, 9 + y, [
    '..aaaaaaaaaaaaaaww',
    '.aaaaaaaaaaaaaaaww',
    '.aaaaaaaaaaaaaaaw',
    '.aAAwwwwwwwwwaaa',
    '..A..AAwwwwwAA',
  ]);
  // Rosettes: little rings and dots of black over the gold.
  for (const [rx, ry] of [[4, 10], [7, 9], [10, 10], [13, 9], [6, 12], [9, 12], [12, 12], [15, 6], [17, 5]] as const) p.set(rx, ry + y, 'K');
  for (const [rx, ry] of [[5, 10], [8, 9], [11, 10], [14, 9]] as const) p.set(rx, ry + y, 'd');
  p.rows(0, 10 + y, ['..a', '.aK', '.a', 'Ka', 'a', 'K', 'ak', '.k']);
  if (pose.eye === 'open') p.set(16, 6 + y, 'V').set(17, 6 + y, 'k');
  else if (pose.eye === 'closed') p.rect(16, 6 + y, 2, 1, 'A');
  else p.set(16, 5 + y, 'k').set(17, 6 + y, 'k');
  if (pose.mouth) p.rect(17, 9 + y, 3, 1, 'R');
  legs(p, pose, [4, 6, 12, 14], 14 + y, 'a', 'A');
  return p;
};

// ====================================== ESPECIALES ======================================

// ---- El Caleuchito: un perrito fantasma del barco del Caleuche. Celeste translúcido con brillos,
// ojos que brillan y, en vez de patas, una cola de niebla que ondea ----
const caleuchito: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy - 2;
  p.rows(0, 4 + y, [
    '.............ii..ii',
    '............iIIiiIIi',
    '..i........iiiiiiiiii',
    '.iWi.......iiiiiiiWii',
    '..iIi......iiiiiiiiiW',
    '...iIiiiiiiiiiiWWWW',
    '....iiiiiiiiiiiii',
    '...iiiiiiiiiiiiii',
    '...iIiiiiiiiiiii',
    '...IIiiiiiiiiiI',
  ]);
  // The misty tail instead of legs, waving with the trot.
  const wv = pose.legs === 'a' ? 1 : pose.legs === 'b' ? -1 : 0;
  p.rows(3 + wv, 14 + y, ['IiIiIiIiIiI', '.I.i.I.i.I', '..I...I...']);
  if (pose.eye === 'open') p.rect(16, 7 + y, 2, 2, 'b').set(16, 7 + y, 'W');
  else if (pose.eye === 'closed') p.rect(16, 8 + y, 2, 1, 'I');
  else p.set(16, 7 + y, 'B').set(17, 8 + y, 'B');
  if (pose.mouth) p.rect(18, 10 + y, 3, 1, 'B');
  return p;
};

// ---- El Pillán: un perro de fuego que bajó del volcán. Rojo brasa, una melena y una cola de
// llamas amarillas que bailan, y ojos encendidos ----
const pillan: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const f = pose.wiggle ? 1 : 0;
  // Flames: mane along the back and a flaming tail (they flicker with the idle frames).
  p.rows(0, 4 + y - f, ['..y......y.y.y', '.yay....yayaya', 'yaray..yaaaaay', '.yraay.']);
  p.rows(0, 6 + y, [
    '.............RR..RR',
    '............RrrRRrrR',
    '...........Rrrrrrrrr',
    '..rr.......rrrrrrrryr',
    '...rrRRRRRRrrrrrrrrrR',
    '....RrrrrrrrrrrrrRRR',
    '....RrrrrrrrrrrrrR',
    '....RRaaaaaaaaRrrR',
    '.....RR.....RRRR',
  ]);
  if (pose.eye === 'open') p.rect(16, 9 + y, 2, 1, 'y').set(17, 9 + y, 'W');
  else if (pose.eye === 'closed') p.rect(16, 9 + y, 2, 1, 'R');
  else p.set(16, 8 + y, 'y').set(17, 9 + y, 'y');
  if (pose.mouth) p.rect(18, 11 + y, 3, 1, 'y');
  legs(p, pose, [5, 7, 13, 15], 15 + y, 'R', 'k');
  return p;
};

// ---- El Perro del Dieciocho: un quiltro de fiesta, con chupalla de paja y cinta roja y una manta
// de colores sobre el lomo ----
const dieciocho: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  p.rect(2 - tw, 7 + y, 2, 5, 'c').set(2 - tw, 6 + y, 'C');
  p.ellipse(10, 14 + y, 6.5, 3.4, 'c').ellipse(10, 16 + y, 5, 1, 'l');
  // The manta: red with white and blue stripes and a fringe.
  p.rect(5, 10 + y, 9, 4, 'r').rect(5, 11 + y, 9, 1, 'w').rect(5, 12 + y, 9, 1, 'b');
  p.rows(5, 14 + y, ['r.r.r.r.r']);
  p.rect(13, 9 + y, 3, 4, 'c');
  p.disc(16.5, 8.5 + y, 3.3, 'c').rect(18, 9 + y, 4, 2, 'l').set(21, 9 + y, 'k');
  p.rect(14, 6 + y, 2, 2, 'C').rect(18, 6 + y, 2, 2, 'C');
  // The chupalla: flat straw brim, crown and the red ribbon.
  p.rect(12, 4 + y, 10, 1, 'a').rect(14, 1 + y, 6, 3, 'a').rect(14, 3 + y, 6, 1, 'r').rect(14, 1 + y, 6, 1, 'A');
  if (pose.eye === 'open') p.rect(17, 7 + y, 2, 2, 'k').set(17, 7 + y, 'W');
  else if (pose.eye === 'closed') p.rect(17, 8 + y, 2, 1, 'k');
  else p.set(17, 7 + y, 'k').set(18, 8 + y, 'k');
  if (pose.mouth) p.rect(19, 11 + y, 2, 1, 'R');
  legs(p, pose, [5, 8, 12, 15], 17 + y, 'c', 'C');
  return p;
};

// ---- El Trauquito: el Trauco chiquito de los bosques de Chiloé. Bajito y barbón, gorro cónico de
// quilineja, ropa de fibra vegetal, y su hacha de piedra ----
const trauco: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  // Conical fibre cap and the big head with a beard.
  p.rows(7, 0 + y, ['...ff', '..ffF', '..fffF', '.fffffF']);
  p.disc(10, 7 + y, 3.2, 'l').rect(7, 8 + y, 7, 4, 'n').rect(8, 12 + y, 5, 1, 'n');
  p.set(13, 7 + y, 'C');
  // Body in plant-fibre clothes.
  p.rect(7, 12 + y, 6, 5, 'v').rect(7, 13 + y, 6, 1, 'f').rect(7, 15 + y, 6, 1, 'f');
  // The stone axe raised in one hand.
  p.rect(14, 7 + y, 1, 8, 'd').rect(13, 5 + y, 4, 3, 'm').set(13, 5 + y, 'M');
  p.set(13, 12 + y, 'l');
  if (pose.eye === 'open') p.set(11, 6 + y, 'k').set(9, 6 + y, 'k');
  else if (pose.eye === 'closed') p.rect(9, 6 + y, 3, 1, 'C');
  else p.set(11, 6 + y, 'r').set(9, 6 + y, 'r');
  if (pose.mouth) p.rect(9, 9 + y, 3, 1, 'R');
  if (pose.legs !== 'lie') {
    const h = pose.legs === 'tuck' ? 2 : 4;
    p.rect(8 + swing(pose, 0), 17 + y, 2, Math.max(1, h - y), 'd').rect(11 + swing(pose, 1), 17 + y, 2, Math.max(1, h - y), 'd');
  }
  return p;
};

export const personajesSprites2: SpriteDef[] = [
  character('pumaPj', puma),
  character('huemul', huemul),
  character('monito', monito),
  character('flamenco', flamenco, () => ({
    trotar: { fps: 10, frames: [flamencoFly(2), flamencoFly(0.4), flamencoFly(-1.2), flamencoFly(0.4)] },
  })),
  character('chinchilla', chinchilla),
  character('loboMarinoPj', loboMarino),
  character('carpintero', carpintero, () => ({
    trotar: { fps: 12, frames: [carpinteroFly(2), carpinteroFly(0.4), carpinteroFly(-1.2), carpinteroFly(0.4)] },
  })),
  character('vizcacha', vizcacha, (pose) => ({
    trotar: { fps: 9, frames: [pose({ legs: 'stand', dy: 0 }), pose({ legs: 'tuck', dy: -2 }), pose({ legs: 'tuck', dy: -3, wiggle: 1 }), pose({ legs: 'stand', dy: 0 })] },
  })),
  character('capibara', capibara),
  character('llamaPj', llama),
  character('tucan', tucan, () => ({
    trotar: { fps: 12, frames: [tucanFly(2), tucanFly(0.4), tucanFly(-1.2), tucanFly(0.4)] },
  })),
  character('jaguar', jaguar),
  character('caleuchito', caleuchito),
  character('pillan', pillan),
  character('dieciocho', dieciocho),
  character('trauco', trauco),
];
