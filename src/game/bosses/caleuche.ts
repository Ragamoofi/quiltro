import { Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { BossDef } from '../../data/jefes.ts';
import type { RunContext } from '../context.ts';
import { Boss } from './boss.ts';

/**
 * El Caleuche: a ghost ship sailing in circles over the fog, firing cannon
 * balls that land where the red circles warn. Phase 2: party music and lights,
 * it summons chonchones and the fog covers half the screen.
 */
export class Caleuche extends Boss {
  private readonly body = new Sprite();
  private readonly sail: Anim;
  private readonly party: Anim;
  private readonly white: Anim;
  private angle = 0;
  private cannonT = 2;
  private summonT = 3;
  private fogT = 0;
  private facing = 1;
  /** Set by the journey so phase 2 can move the half-screen fog. */
  setFog: (side: number) => void = () => {};

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.sail = anim('caleuche', 'navegar');
    this.party = anim('caleuche', 'fiesta');
    this.white = anim('caleuche', 'navegar_blanco');
    this.body.anchor.set(0.5);
    this.root.addChild(this.body);
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.angle = Math.atan2(y - ctx.player.y, x - ctx.player.x);
    for (let i = 0; i < 3; i++) this.addPart(17, 12, ctx);
  }

  protected partPositions(): { x: number; y: number }[] {
    return [-28, 0, 28].map((dx) => ({ x: this.x + dx, y: this.y + 12 }));
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    this.angle += 0.28 * dt;
    // Close enough for the kites on a long line to reach its hull.
    const tx = p.x + Math.cos(this.angle) * 100;
    const ty = p.y + Math.sin(this.angle) * 70;
    const k = 1 - Math.exp(-dt / 0.9);
    const nx = this.x + (tx - this.x) * k;
    if (Math.abs(nx - this.x) > 0.05) this.facing = Math.sign(nx - this.x);
    this.x = nx;
    this.y += (ty - this.y) * k;

    this.cannonT -= dt;
    if (this.cannonT <= 0) {
      this.cannonT = this.phase === 1 ? 2.4 : 2;
      ctx.particles.burst(ctx.rng, this.x + this.facing * 40, this.y + 8, 8, ['G', 'g', 'W'], 40, 0.5);
      ctx.sfx.play('puf', { pitch: 0.35, gain: 1.6 });
      for (let i = 0; i < 3; i++) {
        const cx = p.x + ctx.rngDirector.range(-45, 45);
        const cy = p.y + ctx.rngDirector.range(-35, 35);
        ctx.telegraphs.circle(cx, cy, 18, 1.2 + i * 0.15, () => {
          ctx.enemies.slam(cx, cy - 8, 18, 16 * this.dmg, ctx);
          ctx.particles.burst(ctx.rng, cx, cy, 10, ['K', 'g', 'W'], 60, 0.35);
        });
      }
    }

    if (this.phase === 2) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = 6;
        for (let i = 0; i < 3; i++) ctx.enemies.spawn('chonchon', this.x + ctx.rngDirector.range(-30, 30), this.y + 20, ctx.time / 60, ctx);
        ctx.sfx.play('tuetue', { pitch: 0.9 });
      }
      this.fogT -= dt;
      if (this.fogT <= 0) {
        this.fogT = 6;
        this.setFog(ctx.rngDirector.chance(0.5) ? -1 : 1);
      }
    }
  }

  override dispose(ctx: RunContext): void {
    this.setFog(0);
    super.dispose(ctx);
  }

  draw(alpha: number): void {
    const a = this.flash > 0 ? this.white : this.phase === 2 ? this.party : this.sail;
    const tex = a.textures[frameAt(a, this.time)];
    if (tex) this.body.texture = tex;
    this.body.scale.x = this.facing;
    const bob = Math.round(Math.sin(this.time * 1.5) * 2);
    this.body.position.set(this.lerpX(alpha), this.lerpY(alpha) + bob);
    // It sails over everything, in the fog.
    this.root.zIndex = this.y + 1000;
  }
}
