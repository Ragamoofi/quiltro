import type { SpriteDef } from '../types.ts';
import { volantin } from './armas.ts';
import { cohete, confeti, tejo, trompo } from './armas2.ts';
import { iconos } from './iconos.ts';
import { caja, chorrillana, completo, moteConHuesillo, silbido, temblor } from './objetos.ts';
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
  trompo,
  tejo,
  cohete,
  confeti,
  sopaipilla,
  completo,
  chorrillana,
  moteConHuesillo,
  silbido,
  temblor,
  caja,
  iconos,
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
