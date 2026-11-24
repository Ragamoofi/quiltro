import { spawnPerSecond } from '../../data/balance.ts';
import type { RunContext } from '../context.ts';

/**
 * Phase 1 spawner: enough to judge the feel. Zancudo swarms follow the GDD
 * spawn curve; pigeon flocks swoop in every so often; a ring of zancudos
 * surrounds the dog to practise the ¡GUAU!. Phase 2 replaces it with the
 * zone-driven director.
 */
export class Spawner {
  private acc = 0;
  private nextFlock = 18;
  private nextRing = 40;
  private introDone = false;
  /** Max enemies alive (GDD: 300 desktop, 180 mobile). */
  cap = 300;
  enabled = true;

  update(dt: number, ctx: RunContext, viewW: number, viewH: number): void {
    if (!this.enabled || ctx.player.dead) return;
    const p = ctx.player;
    const minutes = ctx.time / 60;
    const edge = Math.hypot(viewW, viewH) / 2 + 12;

    // Tutorial-ish start: 6 slow zancudos close by at second 3.
    if (!this.introDone && ctx.time > 3) {
      this.introDone = true;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const e = ctx.enemies.spawn('zancudo', p.x + Math.cos(a) * 150, p.y + Math.sin(a) * 110, 0, ctx);
        if (e) e.speed *= 0.5;
      }
    }

    this.acc += spawnPerSecond(minutes) * dt;
    while (this.acc >= 1) {
      const group = Math.min(Math.floor(this.acc), ctx.rng.int(1, 4));
      this.acc -= group;
      if (ctx.enemies.activeCount >= this.cap) continue;
      const a = ctx.rng.range(0, Math.PI * 2);
      const cx = p.x + Math.cos(a) * edge;
      const cy = p.y + Math.sin(a) * edge;
      for (let i = 0; i < group; i++) {
        ctx.enemies.spawn('zancudo', cx + ctx.rng.range(-10, 10), cy + ctx.rng.range(-10, 10), minutes, ctx);
      }
    }

    if (ctx.time >= this.nextFlock) {
      this.nextFlock = ctx.time + ctx.rng.range(16, 24);
      this.flock(ctx, viewW, viewH);
    }
    if (ctx.time >= this.nextRing) {
      this.nextRing = ctx.time + 60;
      this.ring(ctx, 30);
    }
  }

  flock(ctx: RunContext, viewW: number, viewH: number): void {
    const p = ctx.player;
    const a = ctx.rng.range(0, Math.PI * 2);
    const r = Math.hypot(viewW, viewH) / 2 + 30;
    ctx.enemies.spawnFlock(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, ctx.rng.int(8, 15), ctx.time / 60, ctx);
  }

  /** "¡Te rodearon!": a full circle of zancudos closing in. */
  ring(ctx: RunContext, count: number): void {
    const p = ctx.player;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.enemies.spawn('zancudo', p.x + Math.cos(a) * 130, p.y - 8 + Math.sin(a) * 100, ctx.time / 60, ctx);
    }
  }
}
