import { RING_WAVES_MIN, spawnPerSecond } from '../../data/balance.ts';
import { ELITE } from '../../data/enemigos.ts';
import { ZONAS } from '../../data/zonas.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';
import { IMPLEMENTED_ENEMIES } from '../entities/enemies.ts';

/**
 * The director: spawns follow the GDD curve (1,5 + 0,6·t + 0,05·t² per second)
 * with the current zone's enemies. Pigeons arrive as flocks in the Centro, an
 * elite every 60 s (the puma in Patagonia), and a ring of enemies at minutes
 * 2, 5, 8 and 11 ("¡Te rodearon!"). While a boss is on screen the crowd thins.
 */
export class Spawner {
  private acc = 0;
  private nextFlock = 18;
  private nextElite: number = ELITE.every;
  private readonly ringsDone = new Set<number>();
  private introDone = false;
  /** Max enemies alive (GDD: 300 desktop, 180 mobile). */
  cap = 300;
  enabled = true;

  /** Enemy ids for a zone (La Antártica mixes all of them). */
  pool(zoneId: string): string[] {
    if (zoneId === 'antartica') return IMPLEMENTED_ENEMIES.filter((id) => id !== 'paloma');
    const zone = ZONAS.find((z) => z.id === zoneId);
    const list = (zone?.enemies ?? []).filter((id) => IMPLEMENTED_ENEMIES.includes(id) && id !== 'paloma');
    return list.length > 0 ? list : ['zancudo'];
  }

  /** Relative spawn weight: the small fry are common, tanks and chargers rare. */
  private weight(id: string): number {
    return ({ zancudo: 10, jote: 3, guanaco: 2, micro: 1.2, gaviota: 3, loboMarino: 1, chonchon: 8, camahueto: 1.5, basilisco: 2, tempano: 1.5, chingue: 6 } as Record<string, number>)[id] ?? 2;
  }

  update(dt: number, ctx: RunContext, viewW: number, viewH: number, zoneId: string, bossActive: boolean): void {
    if (!this.enabled || ctx.player.dead) return;
    const p = ctx.player;
    const minutes = ctx.time / 60;
    const edge = Math.hypot(viewW, viewH) / 2 + 12;

    // Tutorial start (GDD): 6 slow zancudos close by at second 5.
    if (!this.introDone && ctx.time > 5) {
      this.introDone = true;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const e = ctx.enemies.spawn('zancudo', p.x + Math.cos(a) * 150, p.y + Math.sin(a) * 110, 0, ctx);
        if (e) e.speed *= 0.5;
      }
    }

    const pool = this.pool(zoneId);
    const weights = pool.map((id) => this.weight(id));
    this.acc += spawnPerSecond(minutes) * (bossActive ? 0.4 : 1) * dt;
    while (this.acc >= 1) {
      const group = Math.min(Math.floor(this.acc), ctx.rngDirector.int(1, 4));
      this.acc -= group;
      if (ctx.enemies.activeCount >= this.cap) continue;
      const a = ctx.rngDirector.range(0, Math.PI * 2);
      const cx = p.x + Math.cos(a) * edge;
      const cy = p.y + Math.sin(a) * edge;
      const kind = pool[ctx.rngDirector.weighted(weights)] ?? 'zancudo';
      // Big ones come alone.
      const n = this.weight(kind) < 3 ? 1 : group;
      for (let i = 0; i < n; i++) {
        ctx.enemies.spawn(kind, cx + ctx.rngDirector.range(-10, 10), cy + ctx.rngDirector.range(-10, 10), minutes, ctx);
      }
    }

    if ((zoneId === 'centro' || zoneId === 'antartica') && ctx.time >= this.nextFlock && !bossActive) {
      this.nextFlock = ctx.time + ctx.rngDirector.range(16, 24) / (1 + minutes * 0.08);
      this.flock(ctx, viewW, viewH);
    }

    if (ctx.time >= this.nextElite) {
      // Catch-up guard (debug jumps): never fire a backlog of elites at once.
      this.nextElite = Math.max(this.nextElite + ELITE.every, ctx.time + ELITE.every * 0.5);
      const a = ctx.rngDirector.range(0, Math.PI * 2);
      const kind = zoneId === 'patagonia' ? ELITE.patagoniaElite : ctx.rngDirector.pick(pool);
      ctx.enemies.spawn(kind, p.x + Math.cos(a) * edge, p.y + Math.sin(a) * edge, minutes, ctx, true);
      // A gong, panned to the side it comes from: you know an elite arrived without looking.
      ctx.sfx.play('elite', { pan: Math.cos(a) });
    }

    for (const m of RING_WAVES_MIN) {
      if (minutes >= m && !this.ringsDone.has(m)) {
        this.ringsDone.add(m);
        if (bossActive || minutes - m > 0.25) continue;
        this.ring(ctx, 24 + m * 3, zoneId);
        ctx.banner(t('ui.rodeado'), 'r');
        ctx.sfx.play('alarma');
      }
    }
  }

  flock(ctx: RunContext, viewW: number, viewH: number): void {
    const p = ctx.player;
    const a = ctx.rngDirector.range(0, Math.PI * 2);
    const r = Math.hypot(viewW, viewH) / 2 + 30;
    const size = ctx.rngDirector.int(8, 15) + Math.floor(ctx.time / 60);
    ctx.enemies.spawnFlock(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, size, ctx.time / 60, ctx);
  }

  /** A full circle of the zone's smallest enemy closing in (harmless for the tutorial lesson). */
  ring(ctx: RunContext, count: number, zoneId = 'norte', harmless = false): void {
    const p = ctx.player;
    const minutes = ctx.time / 60;
    const pool = this.pool(zoneId);
    const kind = [...pool].sort((a, b) => this.weight(b) - this.weight(a))[0] ?? 'zancudo';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const e = ctx.enemies.spawn(kind, p.x + Math.cos(a) * 140, p.y - 8 + Math.sin(a) * 105, minutes, ctx);
      if (e) e.harmless = harmless;
    }
  }
}
