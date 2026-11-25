import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/* Fase 9.5: bolitas (canicas de tres colores) y la bola del emboque. */

const bolita = (main: string, light: string, shade: string): Frame =>
  outlined(new Pix(5, 5).disc(2.5, 2.5, 2.5, main).disc(3, 3, 1.5, shade).set(1, 1, light).set(2, 1, light).frame());

const BOLITAS: Frame[] = [bolita('b', 'W', 'B'), bolita('r', 'W', 'R'), bolita('a', 'W', 'A')];

export const bolitas: SpriteDef = {
  name: 'bolita',
  group: 'armas',
  width: 7,
  height: 7,
  anchor: { x: 0.5, y: 0.5 },
  animations: {
    azul: { fps: 1, frames: [BOLITAS[0] as Frame] },
    roja: { fps: 1, frames: [BOLITAS[1] as Frame] },
    dorada: { fps: 1, frames: [BOLITAS[2] as Frame] },
  },
};

/** The emboque's ball: a wooden ball with a painted stripe that turns while it flies. */
const bola = (flip: boolean): Frame =>
  outlined(
    new Pix(9, 9)
      .disc(4.5, 4.5, 4.5, 'o')
      .disc(5.2, 5.2, 3, 'C')
      .rect(0, flip ? 3 : 4, 9, 2, 'r')
      .set(flip ? 2 : 6, 2, 'W')
      .set(flip ? 3 : 5, 2, 'n')
      .frame(),
  );

export const emboqueBola: SpriteDef = {
  name: 'emboque',
  group: 'armas',
  width: 11,
  height: 11,
  anchor: { x: 0.5, y: 0.5 },
  animations: { girar: { fps: 10, frames: [bola(false), bola(true)] } },
};
