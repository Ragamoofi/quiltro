import type { SpriteDef } from '../types.ts';
import { volantin } from './armas.ts';
import { carro, grifo, poste, quiosco } from './decoracion.ts';
import { digitos, globoGuau, hueso, sombras, sopaipilla } from './efectos.ts';
import { paloma, zancudo } from './enemigos.ts';
import { quiltro } from './quiltro.ts';
import { sueloCentro } from './suelos.ts';

/** Every sprite in the game. The build script and /sprites.html read this list. */
export const SPRITES: readonly SpriteDef[] = [
  quiltro,
  zancudo,
  paloma,
  volantin,
  sopaipilla,
  sombras,
  digitos,
  globoGuau,
  hueso,
  poste,
  quiosco,
  carro,
  grifo,
  sueloCentro,
];
