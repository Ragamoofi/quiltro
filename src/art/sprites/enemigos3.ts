import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/*
 * Fase 10.4: los dos enemigos de Santiago. Miran a la derecha y se espejan en el juego.
 *  - Colectivo: el auto negro de techo amarillo que corre por la calle y embiste.
 *  - Rata de plaza: chica, rápida y siempre en grupo.
 */
const enemy = (name: string, anims: Record<string, { fps: number; frames: Frame[] }>, anchorY: number): SpriteDef => {
  const first = Object.values(anims)[0]?.frames[0] ?? [];
  return {
    name,
    group: 'enemigos',
    width: first[0]?.length ?? 0,
    height: first.length,
    anchor: { x: 0.5, y: anchorY },
    flash: true,
    elite: true,
    animations: anims,
  };
};

const colectivo = (spin: boolean): Frame => {
  const p = new Pix(24, 12);
  // Yellow roof sign, then the black body with blue windows.
  p.rect(7, 0, 10, 2, 'y').rect(6, 2, 12, 1, 'y');
  p.rect(4, 3, 16, 3, 'K');
  for (const x of [5, 10, 15]) p.rect(x, 3, 4, 3, 's').set(x + 3, 3, 'W');
  p.rect(0, 6, 24, 3, 'k').rect(0, 6, 24, 1, 'K');
  // Headlight and bumper.
  p.rect(22, 7, 2, 1, 'y').rect(0, 7, 1, 1, 'r').rect(0, 8, 24, 1, 'G');
  // Wheels turn (two frames).
  for (const x of [3, 16]) {
    p.rect(x, 8, 5, 4, 'k').rect(x + 1, 9, 3, 2, spin ? 'g' : 'G').set(x + 2, 10, spin ? 'G' : 'g');
  }
  return outlined(p.frame());
};

const rata = (step: boolean): Frame => {
  const p = new Pix(14, 7);
  // Dark brown (it has to stand out against the grey paving).
  p.ellipse(7, 3.5, 4.6, 2.4, 'd').ellipse(8, 3, 3, 1.4, 'C');
  p.rect(10, 2, 4, 3, 'd').set(13, 3, 'p').set(9, 1, 'p').set(11, 1, 'p');
  p.set(11, 2, 'k').set(11, 3, 'W');
  // A long pink tail that flicks.
  p.rect(0, step ? 4 : 5, 3, 1, 'p').set(0, step ? 3 : 6, 'p');
  // Little legs.
  p.set(step ? 5 : 6, 6, 'K').set(step ? 8 : 7, 6, 'K');
  return outlined(p.frame());
};

export const enemigosCiudad: SpriteDef[] = [
  enemy('colectivo', { andar: { fps: 12, frames: [colectivo(false), colectivo(true)] } }, 0.9),
  enemy('rata', { correr: { fps: 14, frames: [rata(false), rata(true)] } }, 0.85),
];
