import { Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { BossDef } from '../../data/jefes.ts';
import type { RunContext } from '../context.ts';
import { Boss } from './boss.ts';

/**
 * El Alicanto: a metallic bird that circles the dog firing fans of gold and
 * silver feathers. Phase 2: it turns invisible but for its eyes and leaves a
 * trail of gold nuggets that explode.
 */
export class Alicanto extends Boss {
  private readonly body = new Sprite();
  private readonly eyes = new Sprite();
  private readonly shadow = new Sprite();
  private readonly fly: Anim;
  private readonly flyWhite: Anim;
  private readonly eyesAnim: Anim;
  private angle = 0;
  private shotT = 2;
  private nuggetT = 0;

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.fly = anim('alicanto', 'volar');
    this.flyWhite = anim('alicanto', 'volar_blanco');
    this.eyesAnim = anim('alicanto_ojos', 'brillar');
    this.shadow.texture = anim('sombra', 'grande').textures[0] ?? this.shadow.texture;
    this.shadow.anchor.set(0.5);
    this.shadow.scale.set(3, 2);
    for (const s of [this.body, this.eyes]) s.anchor.set(0.5);
    this.root.addChild(this.shadow, this.body, this.eyes);
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.angle = Math.atan2(y - ctx.player.y, x - ctx.player.x);
    this.addPart(16, 14, ctx);
  }

  protected partPositions(): { x: number; y: number }[] {
    return [{ x: this.x, y: this.y }];
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    // Circle the dog, a bit faster in phase 2.
    this.angle += (this.phase === 1 ? 0.55 : 0.85) * dt;
    const tx = p.x + Math.cos(this.angle) * 110;
    const ty = p.y - 20 + Math.sin(this.angle) * 70;
    const k = 1 - Math.exp(-dt / 0.6);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;

    this.shotT -= dt;
    if (this.shotT <= 0) {
      this.shotT = this.phase === 1 ? 2.2 : 3;
      const a = Math.atan2(p.y - 8 - this.y, p.x - this.x);
      ctx.shots.fan(this.x, this.y, a, this.phase === 1 ? 7 : 5, 1.1, px(190), 10 * this.dmg);
      ctx.sfx.play('golpe', { pitch: 2.5 });
    }
    if (this.phase === 2) {
      this.nuggetT -= dt;
      if (this.nuggetT <= 0) {
        this.nuggetT = 0.45;
        const nx = this.x;
        const ny = this.y + 16;
        ctx.telegraphs.circle(nx, ny, 14, 1.3, () => {
          ctx.enemies.slam(nx, ny - 8, 14, 14 * this.dmg, ctx);
          ctx.particles.burst(ctx.rng, nx, ny, 10, ['a', 'y', 'W'], 60, 0.35);
        }, 'a');
      }
    }
  }

  protected override onPhase2(ctx: RunContext): void {
    ctx.particles.burst(ctx.rng, this.x, this.y, 30, ['a', 'y', 'G', 'W'], 120, 0.6);
  }

  draw(alpha: number): void {
    const x = this.lerpX(alpha);
    const y = this.lerpY(alpha);
    const a = this.flash > 0 ? this.flyWhite : this.fly;
    const tex = a.textures[frameAt(a, this.time)];
    if (tex) this.body.texture = tex;
    // Phase 2: invisible, but it shimmers for a moment every 1.5 s.
    const shimmer = Math.floor(this.time * 10) % 15 === 0;
    this.body.visible = this.phase === 1 || this.flash > 0 || shimmer;
    this.eyes.visible = this.phase === 2;
    const et = this.eyesAnim.textures[frameAt(this.eyesAnim, this.time)];
    if (et) this.eyes.texture = et;
    this.body.position.set(x, y);
    this.eyes.position.set(x, y - 15);
    this.shadow.position.set(x, y + 34);
    this.shadow.visible = this.phase === 1;
    this.root.zIndex = y + 40;
  }
}
