import type { Sfx } from '../audio/sfx.ts';
import type { Rng } from '../core/rng.ts';
import type { Enemies } from './entities/enemies.ts';
import type { Food } from './entities/food.ts';
import type { Kites } from './entities/kites.ts';
import type { Player } from './entities/player.ts';
import type { DamageNumbers } from './fx/damageNumbers.ts';
import type { Particles } from './fx/particles.ts';
import type { ScreenFx } from './fx/screenFx.ts';
import type { Shake } from './fx/shake.ts';
import type { SpatialGrid } from './systems/spatialGrid.ts';

/** Everything a system may need during a run, passed instead of globals. */
export interface RunContext {
  readonly rng: Rng;
  readonly sfx: Sfx;
  readonly particles: Particles;
  readonly numbers: DamageNumbers;
  readonly shake: Shake;
  readonly screen: ScreenFx;
  readonly grid: SpatialGrid;
  readonly player: Player;
  readonly enemies: Enemies;
  readonly kites: Kites;
  readonly food: Food;
  /** Seconds since the run started (game time). */
  time: number;
  readonly stats: { kills: number; food: number; damageTaken: number };
  /** Freeze the simulation for a few milliseconds (hit-stop). */
  hitstop(seconds: number): void;
  /** Debug toggles. */
  readonly debug: { invincible: boolean; hitboxes: boolean };
}
