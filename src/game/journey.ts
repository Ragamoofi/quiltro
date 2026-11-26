import type { Container } from 'pixi.js';
import { kmAt, TEMBLOR_WINDOW_MIN } from '../data/balance.ts';
import { ANTARTICA_BOSS_EVERY_MIN, JEFES } from '../data/jefes.ts';
import { ZONAS, type ZoneDef } from '../data/zonas.ts';
import { t } from '../i18n/index.ts';
import { Alicanto } from './bosses/alicanto.ts';
import type { Boss } from './bosses/boss.ts';
import { Caleuche } from './bosses/caleuche.ts';
import { CaiCai } from './bosses/caiCai.ts';
import { Taco } from './bosses/taco.ts';
import type { RunContext } from './context.ts';

export interface JourneyHooks {
  onZone(zone: ZoneDef): void;
  onVictory(): void;
  setTimeScale(v: number): void;
  addBoss(root: Container): void;
  setHalfFog(side: number): void;
  /** Places the friendly moais (secret achievement). */
  addMoais(x: number, y: number): void;
  /** A boss fight starts (true) or ends (false): music and intro sound. */
  onBoss(on: boolean): void;
}

const BOSS_DEATH_SLOWMO = 1;

/**
 * The trip from Arica to Punta Arenas: which zone we are in, when each boss
 * arrives (end of its zone) and what happens when it falls (slow motion,
 * fireworks, a rain of food, a golden box, next zone). Also the once-per-run
 * Temblor event and La Antártica (endless, bosses return every 3 minutes).
 */
export class Journey {
  zoneIndex = 0;
  boss: Boss | null = null;
  antartica = false;
  private readonly hooks: JourneyHooks;
  private bossSpawnedFor = -1;
  private deathT = -1;
  private fireworkT = 0;
  private nextReturn = 0;
  private returns = 0;
  private readonly temblorAt: number;
  private temblorT = -1;
  private temblorDone = false;
  private zoneStart = 0;

  constructor(ctx: RunContext, hooks: JourneyHooks) {
    this.hooks = hooks;
    const [a, b] = TEMBLOR_WINDOW_MIN;
    this.temblorAt = ctx.rngDirector.range(a, b) * 60;
  }

  get zone(): ZoneDef {
    return ZONAS[this.zoneIndex] ?? (ZONAS[0] as ZoneDef);
  }

  get bossActive(): boolean {
    return this.boss !== null;
  }

  /** Shows the first zone's banner. */
  begin(ctx: RunContext): void {
    this.enterZone(0, ctx);
  }

  /**
   * Kilometres travelled: each zone is 3 minutes and 1.075 km of road; the
   * counter waits at the zone's end while its boss is alive, so beating Chile
   * always reads 4.300 km at Punta Arenas. In Antarctica it keeps growing.
   */
  km(time: number): number {
    const z = this.zone;
    const zoneMinutes = Number.isFinite(z.endMin) ? z.endMin - z.startMin : Number.POSITIVE_INFINITY;
    const elapsed = Math.min(zoneMinutes, (time - this.zoneStart) / 60);
    return Math.round(kmAt(z.startMin + elapsed));
  }

  /** Zone ids entered in this run, in order. */
  readonly visited: string[] = [];
  /** Secret route to Rapa Nui (La Antártica only). */
  rapaNui: { x: number; y: number; found: boolean } | null = null;

  restoreCheckpoint(index: number, ctx: RunContext): void {
    this.visited.splice(0, this.visited.length, ...ZONAS.slice(0, index).map(zone => zone.id));
    this.bossSpawnedFor = index - 1;
    this.enterZone(index, ctx);
  }

  private enterZone(index: number, ctx: RunContext): void {
    this.zoneIndex = index;
    this.zoneStart = ctx.time;
    const z = this.zone;
    if (!this.visited.includes(z.id)) this.visited.push(z.id);
    this.antartica = z.id === 'antartica';
    this.hooks.onZone(z);
    ctx.banner(t(`${z.i18n}.titulo`), 'w', t(`${z.i18n}.subtitulo`));
    if (this.antartica) this.nextReturn = ctx.time + ANTARTICA_BOSS_EVERY_MIN * 60;
  }

  update(dt: number, realDt: number, ctx: RunContext): void {
    const z = this.zone;
    const p = ctx.player;

    // A boss closes each zone.
    const zoneSeconds = (z.endMin - z.startMin) * 60;
    if (!this.boss && !this.antartica && z.boss && this.bossSpawnedFor !== this.zoneIndex && ctx.time - this.zoneStart >= zoneSeconds) {
      this.bossSpawnedFor = this.zoneIndex;
      this.spawnBoss(z.boss, ctx);
    }
    // La Antártica: the old bosses come back, tougher, every 3 minutes.
    if (this.antartica && !this.boss && ctx.time >= this.nextReturn) {
      this.returns++;
      this.nextReturn = ctx.time + ANTARTICA_BOSS_EVERY_MIN * 60;
      const id = JEFES[(this.returns - 1) % JEFES.length]?.id ?? 'alicanto';
      this.spawnBoss(id, ctx, this.returns);
    }

    if (this.boss) {
      this.boss.update(dt, ctx);
      if (this.boss.dead && this.deathT < 0) {
        this.deathT = BOSS_DEATH_SLOWMO;
        this.hooks.setTimeScale(0.3);
        ctx.sfx.play('retumbo', { pitch: 1.8 });
      }
    }
    if (this.deathT >= 0 && this.boss) {
      this.deathT -= realDt;
      this.fireworkT -= realDt;
      if (this.fireworkT <= 0) {
        this.fireworkT = 0.12;
        const colors = ctx.rngDirector.pick([['r', 'y', 'W'], ['b', 's', 'W'], ['p', 't', 'W'], ['a', 'y', 'W']]);
        ctx.particles.burst(ctx.rng, this.boss.x + ctx.rngDirector.range(-50, 50), this.boss.y + ctx.rngDirector.range(-40, 20), 20, colors, 110, 0.6);
        ctx.sfx.play('puf', { pitch: 0.6 + ctx.rngDirector.range(0, 0.4), gain: 1.2 });
      }
      if (this.deathT < 0) this.finishBoss(ctx);
    }

    // Secret: after 2 minutes on the ice, a hint points west, to the island of the guardians.
    if (this.antartica && !this.rapaNui && ctx.time - this.zoneStart > 120) {
      this.rapaNui = { x: p.x - 900, y: p.y + ctx.rngDirector.range(-200, 200), found: false };
      ctx.banner(t('meta.rapaNuiPista'), 'i');
    }
    if (this.rapaNui && !this.rapaNui.found && (p.x - this.rapaNui.x) ** 2 + (p.y - this.rapaNui.y) ** 2 < 70 ** 2) {
      this.rapaNui.found = true;
      this.hooks.addMoais(this.rapaNui.x, this.rapaNui.y);
      ctx.enemies.clearAround(this.rapaNui.x, this.rapaNui.y, 160);
      ctx.achieve('guardianes');
      ctx.banner(t('meta.rapaNuiLlegada'), 'a');
    }

    // Temblor event: once per run, everybody freezes but the dog.
    if (!this.temblorDone && !this.boss && ctx.time >= this.temblorAt && !p.dead) {
      this.temblorDone = true;
      this.temblorT = 2;
      p.movedThisRun = false;
      ctx.enemies.scare(2.6);
      ctx.sfx.play('retumbo');
    }
    if (this.temblorT > 0) {
      this.temblorT -= dt;
      ctx.shake.add(dt * 3);
      if (this.temblorT <= 0) {
        ctx.stats.temblorQuieto = !p.movedThisRun;
        ctx.banner(t('ui.temblor'), 'w');
      }
    }
  }

  spawnBoss(id: string, ctx: RunContext, returns = 0): void {
    if (this.boss) return;
    const def = JEFES.find((j) => j.id === id);
    if (!def) return;
    const minutes = ctx.time / 60;
    const boss: Boss =
      id === 'alicanto'
        ? new Alicanto(def, minutes, returns)
        : id === 'taco'
          ? new Taco(def, minutes, returns)
          : id === 'caleuche'
            ? new Caleuche(def, minutes, returns)
            : new CaiCai(def, minutes, returns);
    boss.applyPasaje(ctx.pasaje.hp, ctx.pasaje.damage);
    if (boss instanceof Caleuche) boss.setFog = (side) => this.hooks.setHalfFog(side);
    const p = ctx.player;
    const a = Math.atan2(p.vy, p.vx) || -Math.PI / 2;
    boss.start(p.x + Math.cos(a) * 170, p.y + Math.sin(a) * 120, ctx);
    this.boss = boss;
    this.deathT = -1;
    this.hooks.addBoss(boss.root);
    this.hooks.onBoss(true);
    ctx.banner(t(`${def.i18n}.nombre`), 'r', t(`${def.i18n}.linea`));
  }

  private finishBoss(ctx: RunContext): void {
    const boss = this.boss;
    if (!boss) return;
    this.hooks.setTimeScale(1);
    ctx.progress.bosses++;
    ctx.stats.bossesBeaten.push(boss.def.id);
    // Rain of food and the golden box.
    ctx.food.dropValue(120 + 60 * ctx.progress.bosses, boss.x, boss.y, ctx, 50);
    ctx.food.drop('cajaDorada', boss.x, boss.y, ctx);
    ctx.telegraphs.clear();
    ctx.shots.clear();
    boss.dispose(ctx);
    this.boss = null;
    this.deathT = -1;
    this.hooks.onBoss(false);
    if (boss.def.id === 'caiCai' && !this.antartica) {
      this.hooks.onVictory();
      return;
    }
    if (!this.antartica) this.enterZone(Math.min(this.zoneIndex + 1, ZONAS.length - 1), ctx);
  }

  /** After beating the final boss: keep going south, forever. */
  continueToAntarctica(ctx: RunContext): void {
    const index = ZONAS.findIndex((z) => z.id === 'antartica');
    this.enterZone(index, ctx);
  }

  /** Debug: jump to a minute, skipping (and counting) the bosses on the way. */
  jumpTo(minutes: number, ctx: RunContext): void {
    if (this.boss) {
      this.boss.dispose(ctx);
      this.boss = null;
      this.hooks.onBoss(false);
    }
    ctx.time = minutes * 60;
    const index = Math.max(0, ZONAS.findIndex((z) => minutes >= z.startMin && minutes < z.endMin));
    this.bossSpawnedFor = index - 1;
    if (index !== this.zoneIndex) this.enterZone(index, ctx);
    this.zoneStart = ((ZONAS[index]?.startMin ?? 0) * 60);
  }

  /** Boss bar data for the HUD (null when there is no boss). */
  bar(): { name: string; ratio: number; intro: number } | null {
    if (!this.boss) return null;
    return { name: t(`${this.boss.def.i18n}.nombre`), ratio: this.boss.hp / this.boss.maxHp, intro: this.boss.intro };
  }

  draw(alpha: number): void {
    this.boss?.draw(alpha);
  }
}
