import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Fase 10.6: la vida de los mapas. Nada de esto daña ni bloquea; es ambiente.
 *  - Santiago como el barrio de la Estación Central: puestos con toldo azul, carros de
 *    comida, cajones de fruta, motos de reparto, autos y gente caminando apurada.
 *  - Mariposas para el sur.
 * Los personajes son siluetas genéricas y las motos no llevan marca ni logo.
 */
const anim1 = (name: string, group: SpriteDef['group'], frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group,
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

// ---- Puesto ambulante con toldo azul y blanco ----
const puestoToldo = (): Frame => {
  const p = new Pix(32, 28);
  // Poles, then the striped blue-and-white awning with a scalloped edge.
  p.rect(1, 8, 2, 20, 'd').rect(29, 8, 2, 20, 'd');
  for (let x = 0; x < 32; x++) {
    const c = Math.floor(x / 4) % 2 === 0 ? 'b' : 'w';
    p.rect(x, 2, 1, 6, c);
    if (x % 4 < 2) p.set(x, 8, c);
  }
  p.rect(0, 2, 32, 1, 'B');
  // The vendor behind the counter (a generic figure in an apron) and hanging goods.
  p.rect(13, 11, 5, 4, 'l').rect(13, 10, 5, 1, 'd').rect(12, 15, 7, 6, 'w').rect(15, 15, 1, 6, 'b');
  p.rect(6, 10, 1, 4, 'g').rect(5, 14, 3, 3, 'r').rect(24, 10, 1, 3, 'g').rect(23, 13, 3, 3, 'y');
  // The counter with things for sale.
  p.rect(2, 21, 28, 6, 'o').rect(2, 21, 28, 1, 'n').rect(2, 26, 28, 2, 'O');
  for (const [x, c] of [
    [4, 'r'],
    [9, 'y'],
    [19, 'v'],
    [24, 'p'],
  ] as const)
    p.rect(x, 18, 4, 3, c).set(x, 18, 'W');
  return outlined(p.frame());
};

// ---- Carro de comida con sombrilla azul y vapor ----
const puestoComida = (): Frame => {
  const p = new Pix(24, 28);
  p.rect(11, 6, 2, 16, 'd');
  p.ellipse(12, 6, 11, 4.5, 'b').rect(1, 6, 22, 1, 'w').rect(5, 3, 2, 3, 'w').rect(11, 2, 2, 4, 'w').rect(17, 3, 2, 3, 'w');
  p.rect(2, 16, 20, 7, 'T').rect(2, 16, 20, 1, 't').rect(4, 18, 6, 3, 'W').rect(14, 18, 6, 3, 'y');
  p.rect(1, 23, 22, 1, 'K').disc(6, 25.5, 2.5, 'k').disc(18, 25.5, 2.5, 'k').set(6, 25, 'g').set(18, 25, 'g');
  // Steam rising from the pot.
  p.rows(14, 10, ['.W.', 'W..', '.W.', '..W']);
  return outlined(p.frame());
};

// ---- Cajones de fruta y una bolsa ----
const cajones = (): Frame => {
  const p = new Pix(18, 16);
  p.rect(0, 7, 9, 9, 'o').rect(0, 7, 9, 1, 'n').rect(0, 11, 9, 1, 'd').rect(0, 15, 9, 1, 'd');
  p.rect(9, 9, 8, 7, 'C').rect(9, 9, 8, 1, 'o').rect(9, 13, 8, 1, 'd');
  for (const [x, y, c] of [
    [1, 5, 'r'],
    [4, 4, 'r'],
    [6, 5, 'y'],
    [10, 7, 'v'],
    [13, 6, 'y'],
    [15, 7, 'r'],
  ] as const)
    p.disc(x + 1, y + 1, 1.5, c);
  return outlined(p.frame());
};

// ---- Moto de reparto: repartidor con casco y una caja térmica turquesa (sin marca) ----
const moto = (spin: boolean): Frame => {
  const p = new Pix(22, 14);
  // Wheels and frame.
  p.disc(4.5, 10.5, 3, 'k').disc(4.5, 10.5, 1.4, spin ? 'G' : 'g').disc(17.5, 10.5, 3, 'k').disc(17.5, 10.5, 1.4, spin ? 'g' : 'G');
  p.rect(5, 7, 13, 2, 'K').rect(16, 4, 1, 6, 'K').rect(15, 3, 4, 1, 'k').set(19, 6, 'y');
  // The rider leaning forward: helmet, jacket, arm to the handlebar.
  p.disc(11, 2.5, 2.3, 'W').set(12, 3, 'k').rect(9, 4, 4, 4, 't').rect(13, 5, 3, 1, 't');
  p.rect(7, 6, 3, 3, 'B');
  // The delivery box on the back.
  p.rect(1, 1, 7, 6, 'T').rect(1, 1, 7, 1, 't').rect(2, 3, 5, 1, 'w');
  return outlined(p.frame());
};

// ---- Gente caminando: cuatro siluetas con ropa distinta ----
const peaton = (shirt: string, pants: string, hair: string, step: boolean): Frame => {
  const p = new Pix(8, 14);
  p.rect(2, 0, 4, 4, 'l').rect(2, 0, 4, 1, hair);
  p.rect(1, 4, 6, 5, shirt).rect(0, 5, 1, 3, shirt).rect(7, 5, 1, 3, shirt);
  if (step) p.rect(1, 9, 3, 5, pants).rect(5, 9, 2, 4, pants).set(5, 13, 'k');
  else p.rect(2, 9, 2, 5, pants).rect(4, 9, 2, 5, pants);
  p.set(1, 13, 'k').set(2, 13, 'k');
  return outlined(p.frame());
};

const mariposa = (open: boolean): Frame =>
  outlined(
    open
      ? new Pix(7, 5).rows(0, 0, ['yy...yy', 'yyy.yyy', '.yykyy.', '..pkp..', '...k...']).frame()
      : new Pix(7, 5).rows(0, 0, ['.......', '..y.y..', '..ykp..', '..pkp..', '...k...']).frame(),
  );

const walker = (name: string, shirt: string, pants: string, hair: string): SpriteDef => ({
  name,
  group: 'decoracion',
  width: 10,
  height: 16,
  anchor: { x: 0.5, y: 1 },
  animations: { caminar: { fps: 5, frames: [peaton(shirt, pants, hair, false), peaton(shirt, pants, hair, true)] } },
});

export const vidaSprites: SpriteDef[] = [
  anim1('puesto_toldo', 'decoracion', puestoToldo()),
  anim1('puesto_comida', 'decoracion', puestoComida()),
  anim1('cajones', 'decoracion', cajones()),
  { name: 'moto', group: 'decoracion', width: 24, height: 16, anchor: { x: 0.5, y: 1 }, animations: { correr: { fps: 14, frames: [moto(false), moto(true)] } } },
  walker('peaton1', 'r', 'B', 'k'),
  walker('peaton2', 'y', 'K', 'd'),
  walker('peaton3', 't', 'M', 'a'),
  walker('peaton4', 'p', 'b', 'k'),
  { name: 'mariposa', group: 'decoracion', width: 9, height: 7, anchor: { x: 0.5, y: 0.5 }, animations: { aletear: { fps: 7, frames: [mariposa(true), mariposa(false)] } } },
];
