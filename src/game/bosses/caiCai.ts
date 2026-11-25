import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { BossDef } from '../../data/jefes.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';
import { inSegment } from '../systems/telegraphs.ts';
import { Boss } from './boss.ts';

const SOURCE = 'caiCai';
const SEGMENTS = 8;
const SPACING = 15;

interface Segment {
  sprite: Sprite;
  kind: 'cabeza' | 'cuerpo' | 'cola';
  normal: Anim;
  white: Anim;
  x: number;
  y: number;
  facing: number;
}

/**
 * Cai Cai Vilú, the sea serpent of the Chiloé flood myth, the last boss. A long body that
 * circles the dog and raises the sea: phase 1, "marejada", crossing waves (a wide warning band,
 * then the water) and whirlpools under the dog's feet. Phase 2, "responde Tren Tren, la tierra
 * tiembla": the waves come faster and the ground shakes in aftershocks — only the green safe
 * zones protect the dog.
 */
export class CaiCai extends Boss {
  private readonly layer = new Container();
  private readonly segs: Segment[] = [];
  private heading = 0;
  private angle = 0;
  private trail: { x: number; y: number }[] = [];
  private waveT = 2.5;
  private whirlT = 4.5;
  private quakeT = 5;

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.root.addChild(this.layer);
    this.layer.sortableChildren = true;
    for (let i = 0; i < SEGMENTS; i++) {
      const kind = i === 0 ? 'cabeza' : i === SEGMENTS - 1 ? 'cola' : 'cuerpo';
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      this.layer.addChild(sprite);
      const name = kind === 'cabeza' ? 'caiCai' : kind === 'cola' ? 'caiCaiCola' : 'caiCaiCuerpo';
      this.segs.push({ sprite, kind, normal: anim(name, kind), white: anim(name, `${kind}_blanco`), x: 0, y: 0, facing: 1 });
    }
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.heading = Math.atan2(ctx.player.y - y, ctx.player.x - x);
    this.angle = Math.atan2(y - ctx.player.y, x - ctx.player.x);
    this.trail = [];
    for (let i = 0; i < SEGMENTS * SPACING + 10; i++) this.trail.push({ x: x - Math.cos(this.heading) * i, y: y - Math.sin(this.heading) * i });
    // The head and the body hurt a little on contact (7); the waves and whirlpools are the real threat.
    this.addPart(13, 7, ctx);
    for (let i = 1; i < SEGMENTS - 1; i++) this.addPart(10, 7, ctx);
    this.addPart(7, 7, ctx);
    this.placeSegments();
    ctx.shake.add(0.8);
    ctx.sfx.play('retumbo', { pitch: 0.8 });
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
      if (q && Math.abs(p.x - q.x) > 0.4) s.facing = Math.sign(p.x - q.x);
    });
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    // Circles the dog on a wide loop, keeping its body around (it never rushes through).
    this.angle += (this.phase === 1 ? 0.5 : 0.75) * dt;
    const radius = 105;
    const tx = p.x + Math.cos(this.angle) * radius;
    const ty = p.y - 8 + Math.sin(this.angle) * radius * 0.7;
    const want = Math.atan2(ty - this.y, tx - this.x);
    let diff = want - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
    const speed = px(this.phase === 1 ? 135 : 170);
    const steps = Math.max(1, Math.round(speed * dt));
    for (let i = 0; i < steps; i++) {
      this.x += (Math.cos(this.heading) * speed * dt) / steps;
      this.y += (Math.sin(this.heading) * speed * dt) / steps;
      this.trail.unshift({ x: this.x, y: this.y });
    }
    if (this.trail.length > SEGMENTS * SPACING + 12) this.trail.length = SEGMENTS * SPACING + 12;
    this.placeSegments();

    this.waveT -= dt;
    if (this.waveT <= 0) {
      this.waveT = this.phase === 1 ? 3.2 : 2.5;
      this.wave(ctx, this.phase === 2);
    }
    this.whirlT -= dt;
    if (this.whirlT <= 0) {
      this.whirlT = this.phase === 1 ? 5 : 4;
      this.whirlpool(ctx);
    }
    if (this.phase === 2) {
      this.quakeT -= dt;
      if (this.quakeT <= 0) {
        this.quakeT = 7;
        this.aftershock(ctx);
      }
    }
  }

  /** A wave crosses the screen: a wide band warns, then the water hits (two crossing bands in phase 2). */
  private wave(ctx: RunContext, cross: boolean): void {
    const p = ctx.player;
    ctx.sfx.play('puf', { pitch: 0.5, gain: 1.4 });
    const bands = cross ? 2 : 1;
    for (let k = 0; k < bands; k++) {
      const vertical = k === 1;
      const side = ctx.rngDirector.chance(0.5) ? -1 : 1;
      const off = ctx.rngDirector.range(-25, 25);
      const x0 = vertical ? p.x + off : p.x - side * 190;
      const y0 = vertical ? p.y - side * 140 : p.y + off;
      const x1 = vertical ? x0 : p.x + side * 190;
      const y1 = vertical ? p.y + side * 140 : y0;
      ctx.telegraphs.line(x0, y0, x1, y1, 38, 0.9, () => {
        if (inSegment(p.x, p.y - 8, x0, y0, x1, y1, 21)) p.takeDamage(15 * this.dmg, x0, y0, ctx, SOURCE);
        ctx.shake.add(0.3);
        for (let i = 0; i < 8; i++) {
          const f = (i + 0.5) / 8;
          ctx.particles.burst(ctx.rng, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 4, ['b', 's', 'W'], 70, 0.4);
        }
      });
    }
  }

  /** A whirlpool opens right under the dog. */
  private whirlpool(ctx: RunContext): void {
    const p = ctx.player;
    const wx = p.x;
    const wy = p.y;
    ctx.telegraphs.circle(wx, wy + 6, 26, 1.2, () => {
      ctx.enemies.slam(wx, wy - 2, 26, 14 * this.dmg, ctx, SOURCE);
      ctx.particles.burst(ctx.rng, wx, wy + 4, 14, ['b', 's', 'I', 'W'], 90, 0.5);
    });
  }

  /** Phase 2: Tren Tren answers from the land. Get into a green safe zone or take the hit. */
  private aftershock(ctx: RunContext): void {
    const p = ctx.player;
    const safes = [0, 1].map(() => ({ x: p.x + ctx.rngDirector.range(-80, 80), y: p.y + ctx.rngDirector.range(-55, 55) }));
    for (const s of safes) ctx.telegraphs.circle(s.x, s.y, 22, 1.7, null, 'v');
    ctx.banner(t('jefes.caiCai.temblor'), 'r');
    ctx.telegraphs.circle(p.x, p.y, 4, 1.7, () => {
      ctx.shake.add(1);
      ctx.sfx.play('retumbo');
      const safe = safes.some((s) => (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < 22 * 22);
      if (!safe) p.takeDamage(22 * this.dmg, p.x, p.y + 20, ctx, SOURCE);
    }, 'K');
  }

  protected override onPhase2(ctx: RunContext): void {
    ctx.banner(t('jefes.caiCai.linea2'), 'r');
    ctx.particles.burst(ctx.rng, this.x, this.y - 10, 28, ['b', 's', 'I', 'W'], 130, 0.6);
  }

  draw(alpha: number): void {
    const dx = Math.round((this.x - this.prevX) * (alpha - 1));
    const dy = Math.round((this.y - this.prevY) * (alpha - 1));
    let maxY = 0;
    this.segs.forEach((s, i) => {
      const a = this.flash > 0 ? s.white : s.normal;
      const tex = a.textures[frameAt(a, this.time + i * 0.05)];
      if (tex) s.sprite.texture = tex;
      s.sprite.scale.x = s.facing;
      s.sprite.position.set(Math.round(s.x) + dx, Math.round(s.y) + dy);
      s.sprite.zIndex = i === 0 ? 1000 : SEGMENTS - i;
      maxY = Math.max(maxY, s.y);
    });
    this.root.zIndex = maxY + 8;
  }
}
