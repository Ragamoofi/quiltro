import { Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { BossDef } from '../../data/jefes.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';
import { inSegment } from '../systems/telegraphs.ts';
import { Boss } from './boss.ts';

/**
 * El Gran Temblor: a rock titan. Phase 1 alternates ground slams (cracks in a
 * line) and falling rocks. Phase 2, the aftershocks: every 5 s the screen
 * shakes, cracks open in a cross, and only the green safe zones protect the
 * dog — "ahora sí hay que moverse" to reach them.
 */
export class GranTemblor extends Boss {
  private readonly body = new Sprite();
  private readonly idle: Anim;
  private readonly slamAnim: Anim;
  private readonly rage: Anim;
  private readonly rageSlam: Anim;
  private readonly white: Anim;
  private attackT = 2.5;
  private attackN = 0;
  private slamShow = 0;
  private quakeT = 4;

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.idle = anim('granTemblor', 'quieto');
    this.slamAnim = anim('granTemblor', 'golpe');
    this.rage = anim('granTemblor', 'furia');
    this.rageSlam = anim('granTemblor', 'furiaGolpe');
    this.white = anim('granTemblor', 'quieto_blanco');
    this.body.anchor.set(0.5, 0.85);
    this.root.addChild(this.body);
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.addPart(28, 20, ctx);
    this.addPart(12, 20, ctx);
    this.addPart(12, 20, ctx);
    ctx.shake.add(1);
    ctx.sfx.play('retumbo');
  }

  protected partPositions(): { x: number; y: number }[] {
    return [
      { x: this.x, y: this.y - 30 },
      { x: this.x - 34, y: this.y - 12 },
      { x: this.x + 34, y: this.y - 12 },
    ];
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    this.slamShow = Math.max(0, this.slamShow - dt);
    // Lumbers toward the dog, keeping a little distance.
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 70) {
      this.x += (dx / d) * 16 * dt;
      this.y += (dy / d) * 16 * dt;
    }

    this.attackT -= dt;
    if (this.attackT <= 0) {
      this.attackT = this.phase === 1 ? 3.2 : 4;
      this.attackN++;
      if (this.attackN % 2 === 1) this.slam(ctx);
      else this.rocks(ctx);
    }

    if (this.phase === 2) {
      this.quakeT -= dt;
      if (this.quakeT <= 0) {
        this.quakeT = 5;
        this.aftershock(ctx);
      }
    }
  }

  /** Cracks in a line (three in phase 2) toward the dog. */
  private slam(ctx: RunContext): void {
    const p = ctx.player;
    this.slamShow = 0.5;
    const base = Math.atan2(p.y - this.y, p.x - this.x);
    const angles = this.phase === 1 ? [base] : [base - 0.35, base, base + 0.35];
    for (const a of angles) {
      const x0 = this.x;
      const y0 = this.y;
      const x1 = x0 + Math.cos(a) * 240;
      const y1 = y0 + Math.sin(a) * 240;
      ctx.telegraphs.line(x0, y0, x1, y1, 14, 0.8, () => {
        if (inSegment(p.x, p.y, x0, y0, x1, y1, 9)) p.takeDamage(20 * this.dmg, x0, y0, ctx);
        ctx.particles.burst(ctx.rng, (x0 + x1) / 2, (y0 + y1) / 2, 14, ['m', 'M', 'a'], 120, 0.4);
      });
    }
    ctx.shake.add(0.4);
    ctx.sfx.play('puf', { pitch: 0.3, gain: 2 });
  }

  /** Falling rocks around the dog. */
  private rocks(ctx: RunContext): void {
    const p = ctx.player;
    for (let i = 0; i < 6; i++) {
      const rx = p.x + ctx.rng.range(-80, 80);
      const ry = p.y + ctx.rng.range(-60, 60);
      ctx.telegraphs.circle(rx, ry, 14, 1 + i * 0.1, () => {
        ctx.enemies.slam(rx, ry - 8, 14, 14 * this.dmg, ctx);
        ctx.particles.burst(ctx.rng, rx, ry, 8, ['m', 'M', 'n'], 50, 0.35);
      });
    }
  }

  /** Phase 2 aftershock: get into a green safe zone or take the hit. */
  private aftershock(ctx: RunContext): void {
    const p = ctx.player;
    const safes = [0, 1].map(() => ({ x: p.x + ctx.rng.range(-80, 80), y: p.y + ctx.rng.range(-55, 55) }));
    for (const s of safes) ctx.telegraphs.circle(s.x, s.y, 22, 1.7, null, 'v');
    ctx.banner(t('jefes.granTemblor.linea'), 'r');
    ctx.telegraphs.circle(p.x, p.y, 4, 1.7, () => {
      ctx.shake.add(1);
      ctx.sfx.play('retumbo');
      const safe = safes.some((s) => (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < 22 * 22);
      if (!safe) p.takeDamage(25 * this.dmg, p.x, p.y + 20, ctx);
      // Cross-shaped cracks through where the dog was.
      for (const [ax, ay] of [
        [1, 0],
        [0, 1],
      ] as const) {
        const x0 = p.x - ax * 160;
        const y0 = p.y - ay * 120;
        ctx.telegraphs.line(x0, y0, p.x + ax * 160, p.y + ay * 120, 12, 0.6, () => {
          if (inSegment(p.x, p.y, x0, y0, x0 + ax * 320, y0 + ay * 240, 8)) p.takeDamage(12 * this.dmg, x0, y0, ctx);
        });
      }
    }, 'K');
  }

  draw(alpha: number): void {
    const a = this.flash > 0 ? this.white : this.phase === 2 ? (this.slamShow > 0 ? this.rageSlam : this.rage) : this.slamShow > 0 ? this.slamAnim : this.idle;
    const tex = a.textures[frameAt(a, this.time)];
    if (tex) this.body.texture = tex;
    this.body.position.set(this.lerpX(alpha), this.lerpY(alpha));
    this.root.zIndex = this.y;
  }
}
