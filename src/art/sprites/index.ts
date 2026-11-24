import type { SpriteDef } from '../types.ts';
import { quiltro } from './quiltro.ts';
import { sueloCentro } from './suelos.ts';

/** Every sprite in the game. The build script and /sprites.html read this list. */
export const SPRITES: readonly SpriteDef[] = [quiltro, sueloCentro];
