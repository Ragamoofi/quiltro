import type { Sfx } from '../audio/sfx.ts';
import type { Rng } from '../core/rng.ts';
import type { Build, Stats } from './build.ts';
import type { Enemies, Enemy } from './entities/enemies.ts';
import type { Food } from './entities/food.ts';
import type { Player } from './entities/player.ts';
import type { DamageNumbers } from './fx/damageNumbers.ts';
import type { Particles } from './fx/particles.ts';
import type { ScreenFx } from './fx/screenFx.ts';
import type { Shake } from './fx/shake.ts';
import type { Clouds } from './systems/clouds.ts';
import type { EnemyShots } from './systems/enemyShots.ts';
import type { SpatialGrid } from './systems/spatialGrid.ts';
import type { Telegraphs } from './systems/telegraphs.ts';

/** Everything a system may need during a run, passed instead of globals. */
export interface RunContext {
  /**
   * Three random streams, all from the run's seed. `rngDirector` decides what
   * attacks and when (enemies, elites, flocks, bosses, hazards) and `rngCards`
   * deals the level-up and box cards, so the Ruta del día gives everybody the
   * same trip. `rng` is for everything cosmetic or skill-dependent (crits,
   * loot, particles).
   */
  readonly rng: Rng;
  readonly rngDirector: Rng;
  readonly rngCards: Rng;
  readonly sfx: Sfx;
  readonly particles: Particles;
  readonly numbers: DamageNumbers;
  readonly shake: Shake;
  readonly screen: ScreenFx;
  readonly grid: SpatialGrid;
  readonly player: Player;
  readonly enemies: Enemies;
  readonly food: Food;
  readonly build: Build;
  readonly telegraphs: Telegraphs;
  readonly shots: EnemyShots;
  readonly clouds: Clouds;
  /** Patagonian wind, px/s, pushes the dog, enemies and projectiles. */
  readonly wind: { x: number; y: number };
  /** Passive totals from the build; refresh with `refreshMods()` after any change. */
  mods: Stats;
  refreshMods(): void;
  /** Seconds since the run started (game time). */
  time: number;
  readonly stats: {
    kills: number;
    food: number;
    damageTaken: number;
    /** Damage dealt per weapon id (end screen bars). */
    damageBy: Record<string, number>;
    /** Damage the dog took per source (enemy id, boss id or hazard); used by the balance bot. */
    damageFrom: Record<string, number>;
    /** What dealt the last hit (the cause of death when the dog dies). */
    lastHit: string;
    killsBy: Record<string, number>;
    bossesBeaten: string[];
    /** The dog did not move during the Temblor event ("Ni se inmutó"). */
    temblorQuieto: boolean;
  };
  readonly progress: { level: number; xp: number; lucas: number; bosses: number };
  /** Called for every enemy killed, with the weapon that did it. */
  onKill(e: Enemy, source: string): void;
  /** An achievement was earned (announced once). */
  achieve(id: string): void;
  /** Freeze the simulation for a few milliseconds (hit-stop). */
  hitstop(seconds: number): void;
  /** Show a big banner text (and an optional smaller line) for a moment. */
  banner(text: string, color?: string, subtitle?: string): void;
  /** A Caja del Almacén was touched. */
  openCaja(golden: boolean): void;
  /** Debug toggles. */
  readonly debug: { invincible: boolean; hitboxes: boolean };
}
