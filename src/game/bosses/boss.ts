import { Container } from 'pixi.js';
import type { BossDef } from '../../data/jefes.ts';
import type { RunContext } from '../context.ts';
import type { BossTarget, Enemy } from '../entities/enemies.ts';

/** Boss HP grows gently with time (the enemy curve would make the last boss ×5.7). */
export function bossHpMult(minutes: number, returns = 0): number {
  return (1 + 0.05 * minutes) * (1 + 0.5 * returns);
}

/**
 * Base for the four bosses: HP, two phases (phase 2 below 50 %), a 2-second
 * intro during which it cannot be hurt, and invisible hitboxes ("parts") in
 * the enemy pool so every weapon hits it without special cases.
 */
export abstract class Boss implements BossTarget {
  readonly root = new Container();
  readonly def: BossDef;
  hp: number;
  maxHp: number;
  phase: 1 | 2 = 1;
  intro = 2;
  dead = false;
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  flash = 0;
  time = 0;
  protected parts: Enemy[] = [];
  private readonly lastHitBy = new Map<string, number>();
  /** Damage multiplier from the run's minute. */
  protected dmg = 1;

  constructor(def: BossDef, minutes: number, returns: number) {
    this.def = def;
    this.maxHp = this.hp = def.hp * bossHpMult(minutes, returns);
    this.dmg = 1 + 0.08 * minutes;
  }

  /** Fase 11.6: a harder pasaje gives the boss more life and a harder hand. Call before `start`. */
  applyPasaje(life: number, damage: number): void {
    this.maxHp = this.hp = this.hp * life;
    this.dmg *= damage;
  }

  get invulnerable(): boolean {
    return this.intro > 0 || this.dead;
  }

  /** Creates hitboxes; subclasses call it from `start`. */
  protected addPart(radius: number, damage: number, ctx: RunContext): void {
    const e = ctx.enemies.spawnPart(this, radius, damage * this.dmg, ctx);
    if (e) this.parts.push(e);
  }

  /** Positions of the hitboxes, one per part, in world coordinates. */
  protected abstract partPositions(): { x: number; y: number }[];

  abstract start(x: number, y: number, ctx: RunContext): void;
  protected abstract think(dt: number, ctx: RunContext): void;
  protected onPhase2(_ctx: RunContext): void {}
  abstract draw(alpha: number): void;

  hit(amount: number, _crit: boolean, source: string, ctx: RunContext): void {
    if (this.invulnerable) return;
    // Bosses made of several hitboxes: one hit per weapon per instant, not one per part.
    if (this.parts.length > 1) {
      const last = this.lastHitBy.get(source) ?? -1;
      if (this.time - last < 0.12) return;
      this.lastHitBy.set(source, this.time);
    }
    const dealt = Math.min(this.hp, amount);
    this.hp -= amount;
    ctx.stats.damageBy[source] = (ctx.stats.damageBy[source] ?? 0) + dealt;
    this.flash = 2 / 30;
    if (this.phase === 1 && this.hp <= this.maxHp * this.def.phase2At) {
      this.phase = 2;
      ctx.shake.add(0.5);
      ctx.sfx.play('retumbo', { pitch: 1.4 });
      this.onPhase2(ctx);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  update(dt: number, ctx: RunContext): void {
    this.prevX = this.x;
    this.prevY = this.y;
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    if (this.intro > 0) this.intro -= dt;
    else if (!this.dead) this.think(dt, ctx);
    const pos = this.partPositions();
    this.parts.forEach((e, i) => {
      const p = pos[i];
      if (!p) return;
      e.prevX = e.x;
      e.prevY = e.y;
      e.x = p.x;
      e.y = p.y;
    });
  }

  dispose(ctx: RunContext): void {
    for (const e of this.parts) ctx.enemies.remove(e);
    this.parts = [];
    this.root.destroy({ children: true });
  }

  protected lerpX(alpha: number): number {
    return Math.round(this.prevX + (this.x - this.prevX) * alpha);
  }

  protected lerpY(alpha: number): number {
    return Math.round(this.prevY + (this.y - this.prevY) * alpha);
  }
}
