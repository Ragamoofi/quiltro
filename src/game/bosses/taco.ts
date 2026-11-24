import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { BossDef } from '../../data/jefes.ts';
import type { RunContext } from '../context.ts';
import { inSegment } from '../systems/telegraphs.ts';
import { Boss } from './boss.ts';

const SEGMENTS = 12;
const SPACING = 26;
const COLORS = ['rojo', 'azul', 'turquesa', 'rosado'] as const;

interface Segment {
  sprite: Sprite;
  normal: Anim;
  white: Anim;
  micro: boolean;
  x: number;
  y: number;
  facing: number;
}

/**
 * El Taco: a snake of 12 cars and buses chasing the dog. Every horn blast is a
 * cone of damage in front of the head. Phase 2: cars come loose from the tail
 * and charge as micros.
 */
export class Taco extends Boss {
  private readonly segs: Segment[] = [];
  private readonly layer = new Container();
  private heading = 0;
  private trail: { x: number; y: number }[] = [];
  private hornT = 3;
  private detachT = 2.5;

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.root.addChild(this.layer);
    for (let i = 0; i < SEGMENTS; i++) {
      const micro = i > 0 && i % 4 === 0;
      const name = i === 0 ? 'cabeza' : (COLORS[i % COLORS.length] ?? 'rojo');
      const normal = micro ? anim('micro', 'andar') : anim('auto', name);
      const white = micro ? anim('micro', 'andar_blanco') : anim('auto', `${name}_blanco`);
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      this.layer.addChild(sprite);
      this.segs.push({ sprite, normal, white, micro, x: 0, y: 0, facing: 1 });
    }
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.heading = Math.atan2(ctx.player.y - y, ctx.player.x - x);
    this.trail = [];
    for (let i = 0; i < SEGMENTS * SPACING; i++) this.trail.push({ x: x - Math.cos(this.heading) * i, y: y - Math.sin(this.heading) * i });
    for (let i = 0; i < SEGMENTS; i++) this.addPart(11, 16, ctx);
    this.placeSegments();
  }

  protected partPositions(): { x: number; y: number }[] {
    return this.segs.map((s) => ({ x: s.x, y: s.y }));
  }

  private placeSegments(): void {
    this.segs.forEach((s, i) => {
      const p = this.trail[Math.min(this.trail.length - 1, i * SPACING)];
      const q = this.trail[Math.min(this.trail.length - 1, i * SPACING + 4)];
      if (!p) return;
      s.x = p.x;
      s.y = p.y;
      if (q && Math.abs(p.x - q.x) > 0.5) s.facing = Math.sign(p.x - q.x);
    });
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    // Head steers toward the dog with a limited turn rate (it is a traffic jam, after all).
    const want = Math.atan2(p.y - 8 - this.y, p.x - this.x);
    let diff = want - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += Math.max(-1.3 * dt, Math.min(1.3 * dt, diff));
    const speed = px(this.phase === 1 ? 105 : 125);
    const steps = Math.max(1, Math.round(speed * dt));
    for (let i = 0; i < steps; i++) {
      this.x += Math.cos(this.heading) * (speed * dt) / steps;
      this.y += Math.sin(this.heading) * (speed * dt) / steps;
      this.trail.unshift({ x: this.x, y: this.y });
    }
    if (this.trail.length > SEGMENTS * SPACING + 10) this.trail.length = SEGMENTS * SPACING + 10;
    this.placeSegments();

    // Horn: a cone of noise in front of the head.
    this.hornT -= dt;
    if (this.hornT <= 0) {
      this.hornT = this.phase === 1 ? 3 : 2.4;
      const hx = this.x;
      const hy = this.y;
      const ex = hx + Math.cos(this.heading) * 80;
      const ey = hy + Math.sin(this.heading) * 80;
      ctx.sfx.play('bocina', { pitch: 1.2 });
      ctx.telegraphs.line(hx, hy, ex, ey, 40, 0.6, () => {
        if (inSegment(p.x, p.y - 8, hx, hy, ex, ey, 22)) p.takeDamage(14 * this.dmg, hx, hy, ctx);
        ctx.shake.add(0.15);
      });
    }

    // Phase 2: the tail breaks off and charges.
    if (this.phase === 2 && this.segs.length > 3) {
      this.detachT -= dt;
      if (this.detachT <= 0) {
        this.detachT = 2.5;
        const s = this.segs.pop();
        const part = this.parts.pop();
        if (part) ctx.enemies.remove(part);
        if (s) {
          s.sprite.destroy();
          const m = ctx.enemies.spawn('micro', s.x, s.y, ctx.time / 60, ctx);
          if (m) m.timer = 0;
          ctx.particles.burst(ctx.rng, s.x, s.y, 10, ['y', 'K', 'G'], 60, 0.4);
        }
      }
    }
  }

  draw(alpha: number): void {
    const dx = Math.round((this.x - this.prevX) * (alpha - 1));
    const dy = Math.round((this.y - this.prevY) * (alpha - 1));
    let maxY = 0;
    this.segs.forEach((s, i) => {
      const a = this.flash > 0 ? s.white : s.normal;
      const tex = a.textures[frameAt(a, this.time + i * 0.1)];
      if (tex) s.sprite.texture = tex;
      s.sprite.scale.x = s.facing;
      s.sprite.position.set(Math.round(s.x) + dx, Math.round(s.y) + dy);
      s.sprite.zIndex = s.y;
      maxY = Math.max(maxY, s.y);
    });
    this.layer.sortableChildren = true;
    this.root.zIndex = maxY + 8;
  }
}
