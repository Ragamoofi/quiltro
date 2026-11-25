import { Pix } from '../draw.ts';
import { outlined, type Frame, type SpriteDef } from '../types.ts';

/** The chest of the road: a wooden chest with golden bands and a lock (Fase 11.3). */
const COFRE = ((): Frame => {
  const p = new Pix(24, 20);
  // Dark wood so it stands out on sand and grass; golden bands and a lock.
  p.rect(1, 8, 22, 11, 'd').rect(1, 17, 22, 2, 'k');
  p.ellipse(12, 8, 11, 6, 'C').rect(0, 8, 24, 6, '.').rect(1, 8, 22, 11, 'd');
  p.ellipse(12, 7.4, 10, 5, 'C').rect(1, 7, 22, 2, 'd');
  p.rect(2, 3, 20, 1, 'C').rect(1, 12, 22, 1, 'k');
  p.rect(4, 3, 3, 16, 'a').rect(4, 3, 1, 16, 'W').rect(17, 3, 3, 16, 'a').rect(17, 3, 1, 16, 'W');
  p.rect(10, 9, 5, 6, 'y').rect(10, 9, 5, 1, 'W').set(12, 11, 'k').rect(12, 12, 1, 2, 'k');
  p.set(1, 1, 'W').set(2, 0, 'y').set(1, -1, 'W').set(21, 2, 'W');
  return outlined(p.frame());
})();
export const eventosSprites: SpriteDef[] = [
  {
    name: 'cofre_ruta',
    group: 'decoracion',
    width: COFRE[0]?.length ?? 0,
    height: COFRE.length,
    anchor: { x: 0.5, y: 1 },
    animations: { quieto: { fps: 1, frames: [COFRE] } },
  },
];
