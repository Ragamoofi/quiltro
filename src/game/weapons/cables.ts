import { Container, Graphics } from 'pixi.js';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import type { RunContext } from '../context.ts';
import { Cooldown, type Weapon } from './weapon.ts';

const FIRST_RANGE = 170;
const JUMP_RANGE = 75;
const SHOW = 0.16;
const Y = hexToNumber(colorOf('y')?.hex ?? '#FFD166');
const W = hexToNumber(colorOf('W')?.hex ?? '#FFFFFF');

interface Bolt {
  life: number;
  points: { x: number; y: number }[];
  seed: number;
}

/**
 * Maraña de cables: a spark from the overhead wires that strikes the nearest
 * enemy and jumps from one to the next (`chains` jumps).
 */
export class Cables implements Weapon {
  readonly id = 'cables';
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly cd = new Cooldown();
  private bolts: Bolt[] = [];

  constructor() {
    this.root.addChild(this.g);
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
    const n = ctx.build.numbers(this.id, ctx.mods);
    if (p.dead || !this.cd.tick(dt, n.cooldown)) return;

    // One strike per extra projectile (La jauría), each starting on a different enemy.
    const strikes = Math.max(1, n.count);
    const used = new Set<number>();
    for (let s = 0; s < strikes; s++) {
      let target = ctx.enemies.nearest(p.x, p.y - 8, FIRST_RANGE, s);
      if (!target || used.has(target.id)) continue;
      // The spark falls from the wires above.
      const points = [{ x: target.x + ctx.rng.range(-6, 6), y: target.y - 60 }];
      for (let j = 0; j <= n.chains && target; j++) {
        used.add(target.id);
        points.push({ x: target.x, y: target.y });
        ctx.enemies.hit(target, n.damage, target.x, target.y - 10, 30, ctx, this.id);
        ctx.particles.burst(ctx.rng, target.x, target.y, 3, ['y', 'W'], 50, 0.2);
        target = ctx.enemies.nearestExcluding(target.x, target.y, JUMP_RANGE, used);
      }
      this.bolts.push({ life: SHOW, points, seed: ctx.rng.int(0, 9999) });
      ctx.sfx.play('golpe', { pitch: 2.2, gain: 1.3 });
    }
  }

  render(): void {
    const g = this.g;
    g.clear();
    for (const b of this.bolts) {
      // Jagged line: each segment broken in 3 with random sideways offsets; blinks.
      if (Math.floor(b.life * 40) % 3 === 0) continue;
      let s = b.seed;
      const rand = (): number => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280 - 0.5;
      };
      for (let i = 1; i < b.points.length; i++) {
        const a = b.points[i - 1];
        const c = b.points[i];
        if (!a || !c) continue;
        g.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5);
        for (let k = 1; k <= 3; k++) {
          const t = k / 3;
          const jx = k < 3 ? rand() * 10 : 0;
          const jy = k < 3 ? rand() * 10 : 0;
          g.lineTo(Math.round(a.x + (c.x - a.x) * t + jx) + 0.5, Math.round(a.y + (c.y - a.y) * t + jy) + 0.5);
        }
      }
      g.stroke({ width: 2, color: Y });
      for (let i = 1; i < b.points.length; i++) {
        const a = b.points[i - 1];
        const c = b.points[i];
        if (!a || !c) continue;
        g.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5).lineTo(Math.round(c.x) + 0.5, Math.round(c.y) + 0.5);
      }
      g.stroke({ width: 1, color: W });
    }
  }
}
