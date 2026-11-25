import { Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { px } from '../../data/balance.ts';
import type { BossDef } from '../../data/jefes.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';
import { inSegment } from '../systems/telegraphs.ts';
import { Boss } from './boss.ts';

const SOURCE = 'vecinoViral';

/**
 * El Vecino Viral: the last boss. A big-lunged neighbour with a megaphone who films
 * everything (an original character: nobody real). Phase 1, "en vivo": he lumbers toward
 * the dog, alternating a megaphone blast (a wide red cone, then a fan of shouts) and a
 * volley of thrown phones. Phase 2, "se hizo viral": his followers show up (a ring of
 * mosquitoes every few seconds) and he charges at the dog after a warning line, ending
 * with a ground slam.
 */
export class VecinoViral extends Boss {
  private readonly body = new Sprite();
  private readonly idle: Anim;
  private readonly shout: Anim;
  private readonly rage: Anim;
  private readonly rageShout: Anim;
  private readonly white: Anim;
  private attackT = 2.5;
  private attackN = 0;
  private shoutShow = 0;
  /** Phones still to throw in the current volley, and the time to the next one. */
  private volley = 0;
  private volleyT = 0;
  private followersT = 5;
  private dashT = 7;
  /** Charge: seconds of warning left, then seconds of running left, and its direction. */
  private windup = 0;
  private run = 0;
  private dirX = 0;
  private dirY = 0;

  constructor(def: BossDef, minutes: number, returns: number) {
    super(def, minutes, returns);
    this.idle = anim('vecinoViral', 'quieto');
    this.shout = anim('vecinoViral', 'grito');
    this.rage = anim('vecinoViral', 'furia');
    this.rageShout = anim('vecinoViral', 'furiaGrito');
    this.white = anim('vecinoViral', 'quieto_blanco');
    this.body.anchor.set(0.5, 0.85);
    this.root.addChild(this.body);
  }

  start(x: number, y: number, ctx: RunContext): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    // Body contact is mild (7): the megaphone, the phones and the charge are the real threats.
    this.addPart(14, 7, ctx);
    this.addPart(22, 7, ctx);
    this.addPart(12, 7, ctx);
    ctx.shake.add(0.6);
    ctx.sfx.play('bocina', { pitch: 0.8 });
  }

  protected partPositions(): { x: number; y: number }[] {
    return [
      { x: this.x - 4, y: this.y - 54 },
      { x: this.x, y: this.y - 28 },
      { x: this.x, y: this.y - 4 },
    ];
  }

  protected think(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    this.shoutShow = Math.max(0, this.shoutShow - dt);

    // The charge: warning, then a fast straight run that ends in a slam.
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) this.run = 0.45;
      return;
    }
    if (this.run > 0) {
      this.run -= dt;
      this.x += this.dirX * px(260) * dt;
      this.y += this.dirY * px(260) * dt;
      if (this.run <= 0) {
        const sx = this.x;
        const sy = this.y;
        ctx.telegraphs.circle(sx, sy, 34, 0.5, () => {
          ctx.enemies.slam(sx, sy - 6, 34, 20 * this.dmg, ctx, SOURCE);
          ctx.particles.burst(ctx.rng, sx, sy, 14, ['m', 'M', 'y'], 130, 0.45);
          ctx.sfx.play('puf', { pitch: 0.4, gain: 1.5 });
        });
      }
      return;
    }

    // Lumbers toward the dog, keeping some distance.
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = this.phase === 1 ? 20 : 30;
    if (d > 90) {
      this.x += (dx / d) * speed * dt;
      this.y += (dy / d) * speed * dt;
    }

    this.attackT -= dt;
    if (this.attackT <= 0) {
      this.attackT = this.phase === 1 ? 3 : 2.4;
      this.attackN++;
      if (this.attackN % 2 === 1) this.blast(ctx);
      else {
        this.volley = this.phase === 1 ? 3 : 4;
        this.volleyT = 0;
      }
    }
    if (this.volley > 0) {
      this.volleyT -= dt;
      if (this.volleyT <= 0) {
        this.volleyT = 0.28;
        this.volley--;
        const a = Math.atan2(p.y - 8 - (this.y - 40), p.x - this.x);
        ctx.shots.fan(this.x, this.y - 40, a, 1, 0, px(135), 8 * this.dmg);
        ctx.sfx.play('golpe', { pitch: 2 });
      }
    }

    if (this.phase === 2) {
      this.followersT -= dt;
      if (this.followersT <= 0) {
        this.followersT = 7;
        this.followers(ctx);
      }
      this.dashT -= dt;
      if (this.dashT <= 0 && this.windup <= 0) {
        this.dashT = 8;
        this.charge(ctx);
      }
    }
  }

  /** The megaphone: a wide red cone toward the dog, then a fan of shouts. */
  private blast(ctx: RunContext): void {
    const p = ctx.player;
    this.shoutShow = 0.9;
    const a = Math.atan2(p.y - 8 - (this.y - 40), p.x - this.x);
    const x0 = this.x;
    const y0 = this.y - 40;
    const x1 = x0 + Math.cos(a) * 210;
    const y1 = y0 + Math.sin(a) * 210;
    ctx.sfx.play('bocina', { pitch: 0.7 });
    ctx.telegraphs.line(x0, y0, x1, y1, 44, 0.9, () => {
      if (inSegment(p.x, p.y - 8, x0, y0, x1, y1, 24)) p.takeDamage(16 * this.dmg, x0, y0, ctx, SOURCE);
      ctx.shots.fan(x0, y0, a, 5, 0.9, px(120), 5 * this.dmg);
      ctx.shake.add(0.3);
      ctx.particles.burst(ctx.rng, x0 + Math.cos(a) * 30, y0 + Math.sin(a) * 30, 10, ['r', 'R', 'W'], 90, 0.35);
    });
  }

  /** Phase 2: the followers arrive, a ring of mosquitoes around the dog. */
  private followers(ctx: RunContext): void {
    const p = ctx.player;
    ctx.banner(t('jefes.vecinoViral.seguidores'), 'a');
    const minutes = ctx.time / 60;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + ctx.rngDirector.range(0, 0.5);
      ctx.enemies.spawn('zancudo', p.x + Math.cos(a) * 130, p.y - 8 + Math.sin(a) * 100, minutes, ctx);
    }
  }

  /** Phase 2: a warning line toward the dog, then he runs through it. */
  private charge(ctx: RunContext): void {
    const p = ctx.player;
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    this.dirX = Math.cos(a);
    this.dirY = Math.sin(a);
    this.windup = 0.8;
    this.shoutShow = 0.8;
    const x0 = this.x;
    const y0 = this.y - 20;
    ctx.telegraphs.line(x0, y0, x0 + this.dirX * 170, y0 + this.dirY * 170, 30, 0.8, null);
    ctx.sfx.play('alarma', { pitch: 0.8 });
  }

  protected override onPhase2(ctx: RunContext): void {
    ctx.banner(t('jefes.vecinoViral.linea2'), 'r');
    ctx.particles.burst(ctx.rng, this.x, this.y - 30, 24, ['y', 'a', 'r', 'W'], 130, 0.6);
  }

  draw(alpha: number): void {
    const loud = this.shoutShow > 0;
    const a =
      this.flash > 0 ? this.white : this.phase === 2 ? (loud ? this.rageShout : this.rage) : loud ? this.shout : this.idle;
    const tex = a.textures[frameAt(a, this.time)];
    if (tex) this.body.texture = tex;
    this.body.position.set(this.lerpX(alpha), this.lerpY(alpha));
    this.root.zIndex = this.y;
  }
}
