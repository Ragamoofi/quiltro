import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';
import { character, quad, stepLegs, wing, type Draw, type Pose } from './personajes.ts';

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


// ---- El Huemul: el ciervo del escudo. Robusto, pardo grisáceo, la máscara negra en "V" de la
// cara, hocico y garganta blancos, orejas grandes y astas cortas en horqueta ----
const huemul: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(13, 7, 15, 'd', 'k', 'k', 1);
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Monito del Monte: el marsupial chiquitito del bosque del sur. Gris pardo con la guata
// crema, ojazos negros con anillo oscuro, orejas redondas, manitos rosadas y una cola larga y
// gruesa enrollada ----
const monito: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(11, 7, 18, 'm', 'M', 'p', 1);
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
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
  const L = quad(12, 7, 18, 'G', 'g', 'p');
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
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


// ==================================== DEL CONTINENTE ====================================


// ---- La Llama: blanca de lana con manchas café, cuello largo, orejas de plátano con borlas de
// colores (como en el altiplano) y patas largas ----
const llama: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(14, 6, 14, 'w', 'n', 'n', 1);
  stepLegs(p, pose, L.far);
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
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Tucán: negro con el pecho amarillo, el pico enorme anaranjado con punta negra y el anillo
// azul alrededor del ojo ----


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




// ============ Fase 11.15: redrawn with legs that walk ============


// ---- El Puma: largo y bajo, pelaje leonado parejo, cabeza de gato redonda con orejas chicas, hocico
// blanco con las marcas oscuras, patas fuertes y la cola larga y gruesa con la punta negra ----
const puma: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(14, 6, 14, 'o', 'O', 'n');
  stepLegs(p, pose, L.far);
  p.rows(0, 12 + y, ['..o', '.oo', '.o', 'oO', 'oO', 'Ok', '.k']);
  p.rows(0, 6 + y, [
    '..............OO..OO',
    '..............oooooo',
    '.............oooooooo',
    '.............oooooowwk',
    '..............oooowww',
  ]);
  p.rows(0, 11 + y, [
    '...ooooooooooooooww',
    '..oooooooooooooooww',
    '..Oooooooooooooooo',
    '...OOnnnnnnnnnnoo',
  ]);
  p.set(18, 11 + y, 'K');
  if (pose.eye === 'open') p.set(16, 8 + y, 'a').set(17, 8 + y, 'k');
  else if (pose.eye === 'closed') p.rect(16, 8 + y, 2, 1, 'O');
  else p.set(16, 7 + y, 'k').set(17, 8 + y, 'k');
  if (pose.mouth) p.rect(17, 11 + y, 3, 1, 'R');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Jaguar: más macizo que el puma, dorado con rosetas negras, cabeza ancha, patas gruesas y
// cola con anillos ----
const jaguar: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(14, 6, 14, 'a', 'A', 'y');
  stepLegs(p, pose, L.far);
  p.rows(0, 12 + y, ['..a', '.aK', '.a', 'Ka', 'aK', 'Ak', '.k']);
  p.rows(0, 6 + y, [
    '..............AA..AA',
    '.............aaaaaaa',
    '.............aaaaaaaa',
    '.............aaaaaawwk',
    '..............aaaawww',
  ]);
  p.rows(0, 11 + y, [
    '...aaaaaaaaaaaaaaww',
    '..aaaaaaaaaaaaaaaww',
    '..Aaaaaaaaaaaaaaaa',
    '...AAwwwwwwwwwwaa',
  ]);
  // Rosettes: little dark rings with a lighter middle.
  for (const [rx, ry] of [[4, 11], [8, 11], [12, 11], [6, 13], [10, 13], [14, 12], [15, 8], [17, 7]] as const) {
    p.set(rx, ry + y, 'K');
    if (rx < 14) p.set(rx + 1, ry + y, 'd');
  }
  if (pose.eye === 'open') p.set(16, 8 + y, 'V').set(17, 8 + y, 'k');
  else if (pose.eye === 'closed') p.rect(16, 8 + y, 2, 1, 'A');
  else p.set(16, 7 + y, 'k').set(17, 8 + y, 'k');
  if (pose.mouth) p.rect(17, 11 + y, 3, 1, 'R');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- La Vizcacha: gris como conejo de orejas largas, la franja oscura del lomo, ojos grandes y la
// cola larga que se enrosca. Patas traseras grandes con el pie plano: avanza a saltos ----
const vizcacha: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  const air = pose.legs === 'tuck' && y < 0;
  p.rows(tw, 6 + y, ['.kg', 'kgg', 'gg', 'gg', 'gg.', '.ggg', '..gg']);
  // The big hind leg: a round thigh and a long flat foot (stretched back when in the air).
  if (pose.legs !== 'lie') {
    if (air) p.rect(2, 18 + y, 6, 1, 'g').rect(1, 19 + y, 3, 1, 'G');
    else p.rect(4, 19, 7, 2, 'g').rect(4, 21, 7, 1, 'G');
  }
  p.ellipse(9, 14 + y, 5.5, 4, 'g').ellipse(9.5, 16.5 + y, 4, 1.2, 'G').rect(5, 11 + y, 7, 1, 'K');
  p.ellipse(7, 16.5 + y, 2.8, 2.4, 'g').ellipse(7, 17 + y, 1.6, 1.4, 'G');
  p.disc(14.5, 10 + y, 3.4, 'g').ellipse(15.5, 11.5 + y, 2, 1.4, 'G');
  p.rect(12, 1 + y, 2, 6, 'g').set(12, 2 + y, 'p').set(12, 3 + y, 'p').rect(14, 2 + y, 2, 5, 'g');
  if (pose.eye === 'open') p.rect(15, 8 + y, 2, 2, 'k').set(15, 8 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 9 + y, 2, 1, 'k');
  else p.set(15, 8 + y, 'k').set(16, 9 + y, 'k');
  p.set(18, 11 + y, 'k').set(19, 10 + y, 'w').set(19, 12 + y, 'w');
  if (pose.mouth) p.set(17, 12 + y, 'R');
  // Small front paws held down (tucked up in the air).
  if (pose.legs !== 'lie') {
    if (air) p.rect(13, 17 + y, 2, 1, 'g');
    else p.rect(13, 17 + y, 1, 21 - (17 + y), 'g').rect(13, 21, 2, 1, 'G');
  }
  return p;
};

// ---- La Capibara (carpincho): barril café, cabeza larga y profunda de hocico romo, ojo y oreja
// arriba y atrás, narices encima del hocico, patas cortas y gruesas. Con su mandarina ----
const capibara: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const L = quad(14, 5, 14, 'O', 'd', 'd');
  stepLegs(p, pose, L.far);
  p.rows(0, 3 + y, [
    '...............aa',
    '..............aaAa',
    '.............CC.CCCC',
    '............CCCCCCCCC',
    '............CCCCCCCCCO',
    '...CCCCCCCCCCCCCCCCOOO',
    '..CCCCCCCCCCCCCCCCOOO',
    '.CCCCCCCCCCCCCCCCOOd',
    '.CCCCCCCCCCCCCCCCO',
    '.CCCCCCCCCCCCCCcc',
    '.OCCCCCCCCCCCccc',
    '..OOcccccccccc',
  ]);
  p.set(13, 5 + y, 'O').set(20, 7 + y, 'd');
  if (pose.eye === 'open') p.set(16, 6 + y, 'k').rect(15, 5 + y, 2, 1, 'O');
  else if (pose.eye === 'closed') p.rect(15, 6 + y, 2, 1, 'O');
  else p.set(16, 5 + y, 'k').set(15, 6 + y, 'k');
  if (pose.mouth) p.rect(18, 10 + y, 2, 1, 'R');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Lobo marino: erguido sobre las aletas delanteras, en forma de "J": cabeza chica en alto
// con hocico corto, bigotes y ojos grandes, cuello grueso, pecho claro, y el cuerpo que baja hasta
// las aletas traseras planas en el suelo. Camina a saltitos, balanceándose ----
const loboMarino: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const sw = pose.legs === 'a' ? 1 : pose.legs === 'b' ? -1 : 0;
  if (pose.legs === 'lie') {
    p.ellipse(10, 17, 9, 3.5, 'C').ellipse(11, 18.5, 7, 1.2, 'c').disc(18, 15, 3, 'C').rect(20, 15, 2, 2, 'O').set(21, 15, 'k');
    p.rows(0, 19, ['dd', 'ddd']);
    return p;
  }
  // Rear flippers flat on the floor behind (they lift when it rocks forward).
  p.rows(0, 19 - (sw > 0 ? 1 : 0), ['ddd', 'ddddd', '.dddd']);
  p.rows(0, 3 + y, [
    '..............CCC',
    '.............CCCCC',
    '.............CCCCCOOk',
    '.............CCCCccO',
    '............CCCCccc',
    '...........CCCCcccc',
    '..........CCCCCcccc',
    '.........CCCCCCcccc',
    '........OCCCCCCcccc',
    '......OOCCCCCCCccc',
    '....OOCCCCCCCCCccc',
    '..OOCCCCCCCCCCCcc',
    '.OCCCCCCCCCCCCcc',
    'OCCCCCCCCCCCCcc',
    '.OCCCCCCCCCcc',
  ]);
  p.set(13, 4 + y, 'O').set(20, 6 + y, 'w').set(21, 7 + y, 'w').set(20, 4 + y, 'w');
  if (pose.eye === 'open') p.rect(15, 4 + y, 2, 2, 'k').set(15, 4 + y, 'W');
  else if (pose.eye === 'closed') p.rect(15, 5 + y, 2, 1, 'O');
  else p.set(15, 4 + y, 'k').set(16, 5 + y, 'k');
  if (pose.mouth) p.rect(17, 7 + y, 2, 1, 'R');
  // The front flipper planted under the chest, stepping forward and back.
  p.rows(12 + sw, 18, ['dd', 'ddd', 'dddd', 'ddddd']);
  return p;
};

// ---- El Tucán: cuerpo negro inclinado, babero blanco con borde amarillo, el pico enorme anaranjado
// que nace en la frente (línea roja arriba, base negra y punta negra), piel azul alrededor del ojo,
// la cola larga hacia abajo y la mancha roja bajo la cola ----
const tucanHead = (p: Pix, cy: number): void => {
  p.disc(15, cy - 1, 2.4, 'K').rect(14, cy, 3, 2, 'w').set(15, cy - 2, 'b').set(16, cy - 2, 'k');
  p.rows(17, cy - 3, ['aaaa', 'aaaaa', 'oooak', 'ooo']).set(17, cy - 2, 'k');
};
const tucan: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  stepLegs(p, pose, [{ x: 8, top: 16, w: 1, color: 'G', shade: 'g', paw: 'g', group: 0, far: true }], 1);
  p.rows(4, 13 + y, ['KK', 'KK', 'KK', '.KK', '.KK', '..K']);
  p.ellipse(9, 11 + y, 4, 5.5, 'K').rect(6, 10 + y, 1, 4, 'g');
  p.ellipse(11.5, 7.5 + y, 2, 2.6, 'w').set(10, 10 + y, 'y').set(11, 10 + y, 'y').set(12, 9 + y, 'y');
  p.set(9, 16 + y, 'r').set(10, 16 + y, 'r');
  p.disc(11, 4 + y, 3, 'K');
  p.rect(11, 3 + y, 2, 2, 'b');
  p.rows(13, 1 + y, ['aaaaa', 'aaaaaaa', 'oooooooak', 'oooooook', '.oooo']);
  p.rect(13, 2 + y, 1, 3, 'k').set(14, 1 + y, 'r').set(15, 1 + y, 'r');
  if (pose.eye === 'open') p.set(12, 3 + y, 'k');
  else if (pose.eye === 'closed') p.rect(11, 3 + y, 2, 1, 'B');
  else p.set(11, 3 + y, 'r').set(12, 4 + y, 'r');
  if (pose.mouth) p.rect(14, 4 + y, 5, 1, 'R');
  stepLegs(p, pose, [{ x: 10, top: 16, w: 1, color: 'G', shade: 'g', paw: 'G', group: 1 }], 1);
  return p;
};
const tucanFly = (lift: number): Frame => birdFly(lift, { body: 'K', belly: 'w', wingC: 'K', patch: null, tip: 'k', tail: 'K', head: tucanHead });

// ---- El Pillán: un perro de fuego que bajó del volcán. Rojo brasa con la guata encendida, orejas,
// melena y cola de llamas amarillas que bailan, y ojos de fuego ----
const pillan: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const f = pose.wiggle ? 1 : 0;
  const L = quad(14, 6, 14, 'r', 'R', 'k');
  stepLegs(p, pose, L.far);
  // Flaming tail.
  p.rows(0, 6 + y - f, ['.y', 'yay', 'yaRy', '.yRR', '..RR']);
  p.ellipse(10, 12.5 + y, 6.5, 3.2, 'r').ellipse(10, 14.8 + y, 5, 0.9, 'a').ellipse(9, 10.6 + y, 4.5, 1, 'R');
  // Flames along the back.
  p.rows(5, 7 + y - f, ['.y..y..y', 'yay.yaya', 'aRaaRaRa']);
  p.rect(13, 8 + y, 3, 5, 'r');
  p.disc(16.5, 7.5 + y, 3.2, 'r').rect(18, 8 + y, 4, 2, 'R').set(21, 8 + y, 'k');
  // Flame ears.
  p.rows(14, 2 + y - f, ['y..y', 'a.ya', 'rr.r']);
  if (pose.eye === 'open') p.set(17, 7 + y, 'y').set(18, 7 + y, 'W');
  else if (pose.eye === 'closed') p.rect(17, 7 + y, 2, 1, 'R');
  else p.set(17, 6 + y, 'y').set(18, 7 + y, 'y');
  if (pose.mouth) p.rect(18, 10 + y, 3, 1, 'y');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Perro del Dieciocho: un quiltro de fonda con chupalla de paja y cinta roja sobre la cabeza
// y una manta de colores en el lomo ----
const dieciocho: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  const tw = pose.wiggle ? 1 : 0;
  const L = quad(14, 6, 15, 'c', 'C', 'l');
  stepLegs(p, pose, L.far);
  p.rect(2 - tw, 8 + y, 2, 5, 'c').set(2 - tw, 7 + y, 'C');
  p.ellipse(10, 13.5 + y, 6.5, 3.2, 'c').ellipse(10, 15.6 + y, 5, 0.9, 'l');
  // The manta: red with white and blue stripes and a fringe.
  p.rect(5, 10 + y, 9, 4, 'r').rect(5, 11 + y, 9, 1, 'w').rect(5, 12 + y, 9, 1, 'b').rows(5, 14 + y, ['r.r.r.r.r']);
  p.rect(13, 9 + y, 3, 5, 'c');
  // A dog's head in profile: skull, long muzzle (lighter), black nose, an ear under the hat.
  p.rows(0, 6 + y, [
    '.............Cccc',
    '.............cccccc',
    '.............cccccllk',
    '..............cccllll',
    '...............ccl',
  ]);
  p.set(13, 7 + y, 'C').set(13, 8 + y, 'C');
  // The chupalla: flat straw brim, crown and the red ribbon.
  p.rect(11, 5 + y, 9, 1, 'a').rect(13, 2 + y, 5, 3, 'a').rect(13, 4 + y, 5, 1, 'r').rect(13, 2 + y, 5, 1, 'A');
  if (pose.eye === 'open') p.set(16, 7 + y, 'k').set(16, 8 + y, 'k');
  else if (pose.eye === 'closed') p.rect(15, 8 + y, 2, 1, 'C');
  else p.set(15, 7 + y, 'k').set(16, 8 + y, 'k');
  if (pose.mouth) p.rect(17, 10 + y, 3, 1, 'R');
  stepLegs(p, pose, L.near);
  return p;
};

// ---- El Trauquito: el Trauco de Chiloé en chico. Jorobado, piel verdosa, orejas en punta, narizón
// y con barba de paja; sombrero cónico y ropa de quilineja, el hacha de piedra al hombro y piernas
// cortas y chuecas que terminan en muñones ----
const trauco: Draw = (pose) => {
  const p = new Pix(22, 22);
  const y = pose.dy;
  stepLegs(p, pose, [{ x: 8, top: 17, color: 'v', shade: 'f', paw: 'f', group: 0, far: true }], 1);
  // The stone axe carried on the back: handle across, the stone head over the shoulder behind.
  p.rect(4, 6 + y, 1, 10, 'd').set(5, 15 + y, 'd').rows(1, 3 + y, ['.MM', 'MmmM', 'MmM.', '.M']);
  // Hunched little body in a cloak of plant fibre with its woven lines.
  p.ellipse(9, 14 + y, 4, 3, 'O').ellipse(8, 12.5 + y, 3, 2, 'O');
  p.rect(6, 13 + y, 7, 1, 'd').rect(6, 15 + y, 6, 1, 'd').set(8, 11 + y, 'd');
  // Gnarled hands.
  p.set(13, 14 + y, 'v').set(12, 15 + y, 'v');
  // A big head pushed forward: green skin, pointed ear, big hooked nose and a long straw beard.
  p.disc(12, 7.5 + y, 3.4, 'v').ellipse(11, 9 + y, 2.6, 1.4, 'f');
  p.rows(7, 5 + y, ['v', 'vv']);
  p.rows(15, 7 + y, ['vv', 'vvf', '.f']);
  p.rows(9, 10 + y, ['nnnnnn', 'nnAnnn', '.nnnn', '..nAn', '...n']);
  // Conical hat of quilineja with its wide brim.
  p.rows(10, 0 + y, ['..A', '.AnA', 'AAnAA']);
  p.rect(7, 3 + y, 10, 1, 'A').rect(8, 3 + y, 8, 1, 'n');
  if (pose.eye === 'open') p.rect(13, 6 + y, 2, 1, 'k').set(14, 6 + y, 'y');
  else if (pose.eye === 'closed') p.rect(13, 6 + y, 2, 1, 'f');
  else p.set(13, 5 + y, 'r').set(14, 6 + y, 'r');
  if (pose.mouth) p.rect(13, 9 + y, 2, 1, 'R');
  stepLegs(p, pose, [{ x: 10, top: 17, color: 'v', shade: 'f', paw: 'f', group: 1 }], 1);
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
