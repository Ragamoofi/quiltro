import { Pix } from '../draw.ts';
import { outlined, recolor, type Frame, type SpriteDef } from '../types.ts';

/*
 * Arte de la historia y del tutorial: la Martina (niña ficticia del barrio),
 * su volantín azul, la mano que enseña los controles y la tecla del teclado.
 */
type MartinaPose = 'feliz' | 'llora' | 'alegre';

function martina(pose: MartinaPose, alt: boolean): Frame {
  const p = new Pix(14, 22);
  // Hair with a ponytail, face, dress, legs.
  p.disc(7, 5, 4, 'l').rect(3, 1, 8, 3, 'd').rect(2, 2, 2, 5, 'd').rect(11, 3, 2, 4, 'd').rect(12, 6, 2, 2, 'p');
  p.rect(3, 9, 8, 9, 'p').rect(3, 9, 8, 1, 'r').rect(4, 18, 2, 3, 'l').rect(8, 18, 2, 3, 'l').rect(4, 21, 2, 1, 'K').rect(8, 21, 2, 1, 'K');
  if (pose === 'llora') {
    p.set(5, 5, 'k').set(9, 5, 'k').rect(6, 7, 3, 1, 'R');
    p.set(5, alt ? 7 : 6, 's').set(9, alt ? 6 : 7, 's');
    p.rect(1, 10, 2, 4, 'p').rect(11, 10, 2, 4, 'p').rect(4, 6, 1, 1, 'l');
  } else {
    p.set(5, 5, 'k').set(9, 5, 'k').rect(6, 7, 3, 1, 'R').set(5, 7, 'p').set(9, 7, 'p');
    if (pose === 'feliz') {
      // One arm up holding the string, the other at the side.
      p.rect(11, alt ? 3 : 4, 2, 7, 'l').rect(1, 10, 2, 5, 'p');
    } else {
      // Both arms up: "¡VOLVISTE!"
      p.rect(0, alt ? 2 : 3, 2, 7, 'l').rect(12, alt ? 3 : 2, 2, 7, 'l');
    }
  }
  return outlined(p.frame());
}

export const martinaDef: SpriteDef = {
  name: 'martina',
  group: 'personajes',
  width: 16,
  height: 24,
  anchor: { x: 0.5, y: 1 },
  animations: {
    feliz: { fps: 3, frames: [martina('feliz', false), martina('feliz', true)] },
    llora: { fps: 4, frames: [martina('llora', false), martina('llora', true)] },
    alegre: { fps: 4, frames: [martina('alegre', false), martina('alegre', true)] },
  },
};

const KITE: Frame = [
  '.....k.....',
  '....kbk....',
  '...kbbsk...',
  '..kbbbssk..',
  '.kbbbbsssk.',
  'kbbbbbsssskk',
].map((r) => r.slice(0, 11)).concat(['.kbbbbsssk.', '..kbbbssk..', '...kbbsk...', '....kbk....', '.....k.....']);

export const volantinAzul: SpriteDef = {
  name: 'volantinAzul',
  group: 'armas',
  width: 11,
  height: 11,
  anchor: { x: 0.5, y: 0.5 },
  animations: { ondear: { fps: 4, frames: [KITE, recolor(KITE, { s: 'b', b: 'B' })] } },
};

const MANO = (down: boolean): Frame =>
  outlined(
    new Pix(10, 13)
      .rect(3, down ? 1 : 0, 3, 7, 'w')
      .rect(1, down ? 7 : 6, 8, 5, 'w')
      .rect(6, down ? 6 : 5, 2, 2, 'w')
      .rect(1, down ? 11 : 10, 8, 1, 'G')
      .rect(3, down ? 1 : 0, 1, 7, 'W')
      .frame(),
  );

export const manoDef: SpriteDef = {
  name: 'mano',
  group: 'ui',
  width: 12,
  height: 15,
  anchor: { x: 0.35, y: 0 },
  animations: { tocar: { fps: 3, frames: [MANO(false), MANO(true)] } },
};

const TECLA = (down: boolean): Frame => {
  const p = new Pix(11, 11).rect(0, down ? 1 : 0, 11, 10, 'w').rect(0, down ? 10 : 9, 11, 2, down ? 'G' : 'g').rect(1, down ? 1 : 0, 9, 1, 'W');
  return outlined(p.frame());
};

export const teclaDef: SpriteDef = {
  name: 'tecla',
  group: 'ui',
  width: 13,
  height: 13,
  anchor: { x: 0, y: 0 },
  animations: { arriba: { fps: 1, frames: [TECLA(false)] }, abajo: { fps: 1, frames: [TECLA(true)] } },
};
