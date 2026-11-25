import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Fase 11.1b, cuarta tanda — Santiago: edificios, plaza, parada de micro, semáforo, escalera de
 * metro y fuente. Genérico y original: sin marcas, logos ni edificios reales.
 */
const deco = (name: string, frame: Frame, anchorY = 1): SpriteDef => ({
  name,
  group: 'decoracion',
  width: frame[0]?.length ?? 0,
  height: frame.length,
  anchor: { x: 0.5, y: anchorY },
  animations: { quieto: { fps: 1, frames: [frame] } },
});

/** An office tower: a grid of lit and dark windows, a lobby at the foot and an antenna. */
const torre = (wall: string, shade: string, glass: string, floors: number): Frame => {
  const h = 14 + floors * 5;
  const p = new Pix(26, h + 6);
  p.rect(2, 6, 22, h, wall).rect(2, 6, 3, h, shade).rect(21, 6, 3, h, shade).rect(2, 6, 22, 2, shade);
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < 4; c++) {
      const lit = (f * 3 + c * 5) % 7 === 0;
      p.rect(5 + c * 4, 10 + f * 5, 3, 3, lit ? 'y' : glass);
    }
  }
  p.rect(9, 6 + h - 7, 8, 7, 'k').rect(10, 6 + h - 6, 6, 6, 's').rect(12, 6 + h - 6, 2, 6, 'w');
  p.rect(12, 0, 2, 6, 'g').set(12, 0, 'r');
  return outlined(p.frame());
};

/** A low block: three storeys, a shop at street level with an awning. */
const EDIFICIO_BAJO = ((): Frame => {
  const p = new Pix(32, 30);
  p.rect(1, 4, 30, 26, 'p').rect(1, 4, 30, 2, 'R').rect(1, 28, 30, 2, 'g');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) p.rect(4 + c * 7, 8 + r * 7, 4, 4, 'w').rect(5 + c * 7, 9 + r * 7, 2, 2, 'k');
  p.rect(2, 21, 28, 3, 'b').rect(2, 24, 28, 6, 'K').rect(5, 25, 8, 5, 's').rect(17, 25, 8, 5, 's');
  for (let x = 2; x < 30; x += 4) p.rect(x, 21, 2, 3, 'W');
  return outlined(p.frame());
})();

/** A plane tree of a plaza, with its mottled trunk. */
const ARBOL_PLAZA = ((): Frame => {
  const p = new Pix(34, 42);
  p.rect(14, 20, 5, 22, 'G').rect(14, 20, 2, 22, 'w').rect(17, 26, 2, 5, 'g').rect(14, 32, 2, 4, 'g');
  for (const [cx, cy, rx, ry, c] of [
    [17, 10, 14, 8, 'v'],
    [9, 15, 8, 6, 'f'],
    [25, 15, 8, 6, 'f'],
    [17, 17, 12, 5, 'v'],
  ] as const) p.ellipse(cx, cy, rx, ry, c);
  for (let i = 0; i < 16; i++) p.set(5 + ((i * 7) % 25), 4 + ((i * 5) % 16), i % 3 ? 'V' : 'F');
  return outlined(p.frame());
})();

/** A bus shelter with a blue roof, a bench and a timetable. */
const PARADA = ((): Frame => {
  const p = new Pix(32, 26);
  p.rect(2, 2, 28, 3, 'b').rect(2, 2, 28, 1, 's').rect(2, 5, 28, 1, 'B');
  p.rect(3, 5, 1, 21, 'K').rect(28, 5, 1, 21, 'K');
  p.rect(4, 6, 24, 14, 'i').rect(4, 6, 24, 1, 'W').rect(5, 8, 2, 8, 'W');
  p.rect(7, 17, 18, 2, 'd').rect(8, 19, 1, 5, 'k').rect(23, 19, 1, 5, 'k');
  p.rect(21, 8, 6, 8, 'w').rect(22, 9, 4, 1, 'k').rect(22, 11, 4, 1, 'k').rect(22, 13, 3, 1, 'k');
  return outlined(p.frame());
})();

const SEMAFORO = outlined(
  new Pix(10, 34)
    .rect(4, 10, 2, 24, 'K')
    .rect(2, 0, 6, 12, 'k')
    .rect(3, 1, 4, 3, 'r')
    .rect(3, 5, 4, 3, 'a')
    .rect(3, 9, 4, 2, 'v')
    .rect(3, 1, 4, 1, 'p')
    .rect(0, 12, 10, 1, 'K')
    .frame(),
);

/** Steps going down to the metro, with a handrail and a round sign (no logo). */
const METRO = ((): Frame => {
  const p = new Pix(36, 30);
  p.rect(2, 12, 32, 18, 'g').rect(2, 12, 32, 2, 'G');
  p.rect(6, 14, 24, 14, 'k');
  for (let i = 0; i < 6; i++) p.rect(7 + i * 2, 16 + i * 2, 22 - i * 4, 2, i % 2 ? 'K' : 'g');
  p.rect(4, 5, 1, 9, 'K').rect(31, 5, 1, 9, 'K').rect(4, 5, 28, 1, 'K');
  p.disc(18, 6, 5, 'r').disc(18, 6, 3.2, 'w').rect(17, 5, 3, 3, 'r');
  return outlined(p.frame());
})();

const FUENTE = ((): Frame => {
  const p = new Pix(34, 26);
  p.ellipse(17, 20, 16, 5.5, 'G').ellipse(17, 19, 14, 3.8, 'I').ellipse(17, 18.5, 11, 2.6, 's');
  p.rect(15, 8, 4, 12, 'g').rect(12, 8, 10, 2, 'G').ellipse(17, 8, 5, 2, 'G');
  for (const [x, y] of [[17, 3], [14, 5], [20, 5], [12, 7], [22, 7]] as const) p.rect(x, y, 1, 3, 'W');
  p.rect(10, 18, 14, 1, 'W');
  return outlined(p.frame());
})();

const BANCA = outlined(
  new Pix(24, 14)
    .rect(1, 4, 22, 2, 'C')
    .rect(1, 4, 22, 1, 'o')
    .rect(2, 0, 20, 3, 'C')
    .rect(2, 0, 20, 1, 'o')
    .rect(3, 6, 2, 7, 'k')
    .rect(19, 6, 2, 7, 'k')
    .rect(3, 3, 1, 3, 'k')
    .rect(20, 3, 1, 3, 'k')
    .frame(),
);

export const mapasSantiagoSprites: SpriteDef[] = [
  deco('torre1', torre('g', 'K', 's', 6)),
  deco('torre2', torre('G', 'g', 'b', 8)),
  deco('torre3', torre('t', 'T', 's', 5)),
  deco('edificio_bajo', EDIFICIO_BAJO),
  deco('arbol_plaza', ARBOL_PLAZA),
  deco('parada', PARADA),
  deco('semaforo', SEMAFORO),
  deco('metro', METRO),
  deco('fuente', FUENTE),
  deco('banca', BANCA),
];
